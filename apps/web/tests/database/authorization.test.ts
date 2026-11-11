import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
const db = new PGlite();
const f1 = "10000000-0000-4000-8000-000000000001",
  f2 = "10000000-0000-4000-8000-000000000002",
  off = "10000000-0000-4000-8000-000000000003";
const r1 = "20000000-0000-4000-8000-000000000001",
  r2 = "20000000-0000-4000-8000-000000000002";
const d1 = "30000000-0000-4000-8000-000000000001",
  d2 = "30000000-0000-4000-8000-000000000002",
  p1 = "40000000-0000-4000-8000-000000000001",
  p2 = "40000000-0000-4000-8000-000000000002";
beforeAll(async () => {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
 grant usage on schema auth,storage to authenticated,anon,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,primary key(bucket_id,name));alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
 create function storage.filename(name text) returns text language sql immutable as $$select (string_to_array(name,'/'))[array_length(string_to_array(name,'/'),1)]$$;
 grant select,insert,delete on storage.objects to authenticated;`);
  const migration = readFileSync(
    "../../supabase/migrations/202610310001_initial.sql",
    "utf8",
  ).replace("create extension if not exists pgcrypto;", "");
  await db.exec(migration);
  for (const file of readdirSync("../../supabase/migrations").filter(f => f.endsWith(".sql") && f !== "202610310001_initial.sql").sort()) {
    await db.exec(readFileSync(`../../supabase/migrations/${file}`, "utf8"));
  }
  await db.exec(`insert into auth.users(id,raw_user_meta_data) values('${f1}','{"role":"admin"}'),('${f2}','{}'),('${off}','{}');
 insert into public.regions(id,name) values('${r1}','Test region A'),('${r2}','Test region B');
 update public.user_profiles set role='officer' where id='${off}';insert into public.officer_regions values('${off}','${r1}');
 insert into public.diagnoses(id,owner_id,request_key,status,image_path,result) values('${d1}','${f1}',gen_random_uuid(),'complete','${f1}/${d1}/image','{"prediction":{"crop":"Test crop","disease":"Test disease"}}'),('${d2}','${f2}',gen_random_uuid(),'complete','${f2}/${d2}/image','{"prediction":{"crop":"Test crop","disease":"Test disease"}}');
 insert into public.farmer_reports(id,owner_id,diagnosis_id,region_id,crop,disease,consent_at) values('${p1}','${f1}','${d1}','${r1}','Test crop','Test disease',now()),('${p2}','${f2}','${d2}','${r2}','Test crop','Test disease',now());
 insert into storage.objects(bucket_id,name) values('crop-images','${f1}/${d1}/image'),('crop-images','${f2}/${d2}/image');`);
});
afterAll(() => db.close());
beforeEach(() => db.exec("begin;"));
afterEach(() => db.exec("rollback;"));
async function as(id: string) {
  await db.exec("set local role authenticated;");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true)",
    [id],
  );
}
async function denied(sql: string, params: unknown[] = []) {
  await db.exec("savepoint forbidden;");
  await expect(db.query(sql, params)).rejects.toThrow();
  await db.exec("rollback to savepoint forbidden;");
}
describe("PostgreSQL authorization boundaries", () => {
  it("rejects maintenance from ordinary accounts and invalid batch sizes", async () => {
    await as(f1);
    await denied("select * from public.reconcile_stale_diagnoses()");
    await db.exec("reset role; set local role service_role;");
    await db.query("select set_config('request.jwt.claim.role','service_role',true)");
    await denied("select * from public.reconcile_stale_diagnoses(0)");
    await denied("select * from public.reconcile_stale_diagnoses(1001)");
    await denied("select * from public.reconcile_stale_diagnoses(null)");
  });
  it("expires only stale processing and retries failed objects without touching completed images", async () => {
    const inserted = await db.query<{id: string}>(`insert into public.diagnoses(owner_id,request_key,created_at) values
      ('${f1}',gen_random_uuid(),now()-interval '20 minutes'),
      ('${f1}',gen_random_uuid(),now()) returning id`);
    const [old, recent] = inserted.rows.map(r => r.id);
    const path = `${f1}/${old}/image`;
    await db.query("insert into storage.objects(bucket_id,name) values('crop-images',$1)", [path]);
    await db.exec("set local role service_role;");
    await db.query("select set_config('request.jwt.claim.role','service_role',true)");
    expect((await db.query("select * from public.reconcile_stale_diagnoses()")).rows).toEqual([{image_path:path}]);
    expect((await db.query("select * from public.reconcile_stale_diagnoses()")).rows).toEqual([{image_path:path}]);
    await db.exec("reset role;");
    expect((await db.query("select status,error_code from public.diagnoses where id=$1",[old])).rows).toEqual([{status:'failed',error_code:'processing_expired'}]);
    expect((await db.query("select status from public.diagnoses where id=$1",[recent])).rows).toEqual([{status:'processing'}]);
    expect((await db.query("select status from public.diagnoses where id=$1",[d1])).rows).toEqual([{status:'complete'}]);
    // Stand-in for successful Storage API deletion; production never deletes metadata with SQL.
    await db.query("delete from storage.objects where name=$1",[path]);
    await db.exec("set local role service_role;");
    expect((await db.query("select * from public.reconcile_stale_diagnoses()")).rows).toEqual([]);
  });
  it("permits only the canonical single image path for a reservation", async () => {
    await as(f1);
    const reservation = await db.query<{ id: string }>(
      "select (public.reserve_diagnosis(gen_random_uuid())).id",
    );
    const id = reservation.rows[0].id;
    await denied("insert into storage.objects(bucket_id,name) values('crop-images',$1)", [
      `${f1}/${id}/extra/image`,
    ]);
    await db.query("insert into storage.objects(bucket_id,name) values('crop-images',$1)", [
      `${f1}/${id}/image`,
    ]);
  });
  it("allows owners to remove failed uploads without exposing another owner's image", async () => {
    await as(f1);
    const reservation = await db.query<{ id: string }>(
      "select (public.reserve_diagnosis(gen_random_uuid())).id",
    );
    const id = reservation.rows[0].id;
    const path = `${f1}/${id}/image`;
    await db.query("insert into storage.objects(bucket_id,name) values('crop-images',$1)", [path]);
    await db.exec("reset role; set local role service_role;");
    await db.query("select set_config('request.jwt.claim.role','service_role',true)");
    await db.query("select public.finish_diagnosis($1,$2,null,'test_failure')", [id, f1]);
    await db.exec("reset role;");
    await as(f2);
    expect((await db.query("select * from storage.objects where name=$1", [path])).rows).toHaveLength(0);
    expect((await db.query("delete from storage.objects where name=$1 returning name", [path])).rows).toHaveLength(0);
    await db.exec("reset role;");
    await as(f1);
    expect((await db.query("delete from storage.objects where name=$1 returning name", [path])).rows).toHaveLength(1);
  });
  it("finalizes trusted inference and rolls back malformed predictions", async () => {
    await as(f1);
    const reservation = await db.query<{ id: string }>(
      "select (public.reserve_diagnosis(gen_random_uuid())).id",
    );
    const id = reservation.rows[0].id;
    await db.query(
      "insert into storage.objects(bucket_id,name) values('crop-images',$1)",
      [`${f1}/${id}/image`],
    );
    await db.exec("reset role; set local role service_role;");
    await db.query(
      "select set_config('request.jwt.claim.role','service_role',true)",
    );
    const invalid = {
      schema_version: "1.0",
      status: "success",
      prediction: { crop: "Fixture", disease: "Fixture", confidence: 2 },
      alternatives: [],
    };
    await denied("select public.finish_diagnosis($1,$2,$3::jsonb)", [
      id,
      f1,
      JSON.stringify(invalid),
    ]);
    const valid = {
      ...invalid,
      prediction: { ...invalid.prediction, confidence: 0.7 },
    };
    await db.query("select public.finish_diagnosis($1,$2,$3::jsonb)", [
      id,
      f1,
      JSON.stringify(valid),
    ]);
    await db.exec("reset role;");
    await as(f1);
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.diagnoses where id=$1",
          [id],
        )
      ).rows[0].status,
    ).toBe("complete");
    expect(
      (
        await db.query(
          "select * from public.diagnosis_predictions where diagnosis_id=$1",
          [id],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("enforces minimum contributors and records an investigation lifecycle", async () => {
    const third = "10000000-0000-4000-8000-000000000004";
    await db.query("insert into auth.users(id) values($1)", [third]);
    for (let i = 0; i < 5; i++) {
      const owner = [f1, f2, third][i % 3];
      const dx = await db.query<{ id: string }>(
        "insert into public.diagnoses(owner_id,request_key,status,image_path,result) values($1,gen_random_uuid(),'complete','fixture/path','{}') returning id",
        [owner],
      );
      await db.query(
        "insert into public.farmer_reports(owner_id,diagnosis_id,region_id,crop,disease,consent_at,status) values($1,$2,$3,'Fixture crop','Fixture condition',now(),'verified')",
        [owner, dx.rows[0].id, r1],
      );
    }
    await as(off);
    const result = await db.query<{ id: string }>(
      "select public.open_alert($1,'Fixture crop','Fixture condition','Fixture evidence reviewed') as id",
      [r1],
    );
    const id = result.rows[0].id;
    expect(
      (
        await db.query(
          "select * from public.alert_evidence where alert_id=$1",
          [id],
        )
      ).rows,
    ).toHaveLength(5);
    await db.query(
      "select public.resolve_alert($1,'confirmed','Confirmed using fixture evidence')",
      [id],
    );
    await denied(
      "select public.resolve_alert($1,'dismissed','Cannot overwrite final decision')",
      [id],
    );
    await db.exec("reset role;");
    await as(f1);
    expect(
      (await db.query("select * from public.regional_alerts($1)", [r1])).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query<{ observations: number }>(
          "select * from public.regional_insights($1)",
          [r1],
        )
      ).rows[0].observations,
    ).toBe(5);
    expect(
      (await db.query("select * from public.monitoring_alerts")).rows,
    ).toHaveLength(0);
  });
  it("ignores signup role metadata", async () => {
    await as(f1);
    const result = await db.query<{ role: string }>(
      "select role from public.user_profiles",
    );
    expect(result.rows).toEqual([{ role: "farmer" }]);
  });
  it("prevents self promotion and direct report/diagnosis insertion", async () => {
    await as(f1);
    await denied("update public.user_profiles set role='admin' where id=$1", [
      f1,
    ]);
    await denied("insert into public.farmer_reports(owner_id) values($1)", [
      f1,
    ]);
    await denied(
      "insert into public.diagnoses(owner_id,request_key) values($1,gen_random_uuid())",
      [f1],
    );
  });
  it("allows only permitted profile columns", async () => {
    await as(f1);
    await db.query(
      "update public.user_profiles set display_name='Farmer',language='te' where id=$1",
      [f1],
    );
    expect(
      (
        await db.query<{ language: string }>(
          "select language from public.user_profiles",
        )
      ).rows[0].language,
    ).toBe("te");
  });
  it("isolates farmer diagnoses, reports, and private images", async () => {
    await as(f1);
    expect(
      (await db.query("select * from public.diagnoses")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from public.farmer_reports")).rows,
    ).toHaveLength(1);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      1,
    );
  });
  it("limits officer reads to assigned regional reports and images", async () => {
    await as(off);
    expect(
      (await db.query<{ id: string }>("select id from public.farmer_reports"))
        .rows,
    ).toEqual([{ id: p1 }]);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      1,
    );
  });
  it("blocks farmer and out-of-region reviews", async () => {
    await as(f1);
    await denied("select public.review_report($1,1,'verified','Test review')", [
      p1,
    ]);
    await db.exec("reset role");
    await as(off);
    await denied("select public.review_report($1,1,'verified','Test review')", [
      p2,
    ]);
  });
  it("records a review and audit atomically, rejecting stale versions", async () => {
    await as(off);
    await db.query(
      "select public.review_report($1,1,'verified','Reviewed fixture evidence')",
      [p1],
    );
    expect(
      (
        await db.query<{ status: string; version: number }>(
          "select status,version from public.farmer_reports",
        )
      ).rows,
    ).toEqual([{ status: "verified", version: 2 }]);
    expect(
      (await db.query("select * from public.officer_reviews")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from public.audit_logs")).rows,
    ).toHaveLength(1);
    await denied(
      "select public.review_report($1,1,'rejected','Stale review')",
      [p1],
    );
  });
  it("requires report ownership and consent", async () => {
    await as(f1);
    await denied("select public.submit_report($1,$2,'',true)", [d2, r1]);
    await denied("select public.submit_report($1,$2,'',false)", [d1, r1]);
  });
  it("deduplicates report and diagnosis requests", async () => {
    await as(f1);
    const a = await db.query<{ id: string }>(
      "select public.submit_report($1,$2,'',true) as id",
      [d1, r1],
    );
    expect(a.rows[0].id).toBe(p1);
    const key = "50000000-0000-4000-8000-000000000001";
    await db.query("select public.reserve_diagnosis($1)", [key]);
    await db.query("select public.reserve_diagnosis($1)", [key]);
    expect(
      (
        await db.query("select * from public.diagnoses where request_key=$1", [
          key,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("prevents fabricated model results from authenticated users", async () => {
    await as(f1);
    await denied("select public.finish_diagnosis($1,$2,'{}',null)", [d1, f1]);
  });
  it("suppresses small regional cohorts and enforces alert evidence thresholds", async () => {
    await as(f1);
    expect(
      (await db.query("select * from public.regional_insights($1)", [r1])).rows,
    ).toHaveLength(0);
    await db.exec("reset role");
    await as(off);
    await denied(
      "select public.open_alert($1,'Test crop','Test disease','Test investigation')",
      [r1],
    );
  });
  it("does not permit private data to anonymous users", async () => {
    await db.exec("set local role anon;");
    await denied("select * from public.farmer_reports");
    await denied("select public.regional_insights($1)", [r1]);
  });
});
