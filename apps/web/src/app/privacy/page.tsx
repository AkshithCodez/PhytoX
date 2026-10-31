import { Brand } from "@/components/ui";
export default function Page() {
  return (
    <main id="main" className="prose">
      <Brand />
      <p className="eyebrow">TRUST & TRANSPARENCY</p>
      <h1>Your field. Your information.</h1>
      <h2>AI supports a decision</h2>
      <p>
        Image classifications are suspected conditions, not definitive
        diagnoses. Confidence scores reflect model output, not proven accuracy.
        Unrelated images can receive confident predictions. PhytoX flags
        uncertainty but does not claim reliable unknown-image detection. Ask an
        agricultural expert before deciding on treatment.
      </p>
      <h2>Private by default</h2>
      <p>
        Diagnosis photographs and history are available to your account. When
        you submit a report, officers assigned to that region can inspect its
        photograph, model result, notes, and any location you explicitly share.
        We remove photograph metadata before storage. Images are served through
        short-lived signed links.
      </p>
      <h2>Location and regional insights</h2>
      <p>
        A region is required to submit an observation. Exact coordinates are
        optional and are only available to authorized reviewers and the
        submitting farmer. Farmer-facing summaries show verified observations
        only, with at least three contributing farmers per group. This threshold
        reduces disclosure risk; it is not a formal anonymity guarantee.
      </p>
      <h2>Human verification</h2>
      <p>
        Monitoring signals use transparent report-count rules. They may reflect
        reporting bias, duplicate conditions, limited participation, or model
        errors. Only an authorized officer can confirm an alert, and every
        review is recorded.
      </p>
      <h2>Account and data requests</h2>
      <p>
        For account deletion or data correction, contact the administrator of
        your PhytoX deployment. This project has no configured support address
        or automated deletion workflow. The deployment operator must publish
        retention periods and a support contact before public launch.
      </p>
      <a className="button" href="/">
        Return to website
      </a>
    </main>
  );
}
