"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Copy,
  Check,
  X,
  ExternalLink,
  Sprout,
  RefreshCw,
} from "lucide-react";
import { api, useResource } from "@/lib/client";
import { Notice, PageHeading } from "@/components/ui";
import type { Region } from "@/lib/contracts";

interface FarmerRecord {
  id: string;
  display_name: string;
  email?: string;
  phone?: string;
  village?: string;
  farm_size?: string;
  language: string;
  status: "invited" | "pending_activation" | "active" | "suspended" | "deactivated";
  region_id: string;
  regions?: { id: string; name: string };
  plot_count?: number;
  created_at: string;
}

export function FarmerManagement() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ name: string; link?: string } | null>(null);
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    region_id: "",
    village: "",
    language: "en" as "en" | "te" | "hi",
    phone: "",
    farm_size: "",
  });

  const regionsResource = useResource<Region[]>("/api/regions");
  const regions = regionsResource.data || [];

  // Default region once loaded
  useEffect(() => {
    if (regions.length > 0 && !formData.region_id) {
      setFormData((prev) => ({ ...prev, region_id: regions[0].id }));
    }
  }, [regions]);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("q", search);
  if (regionFilter) queryParams.set("region", regionFilter);
  if (statusFilter) queryParams.set("status", statusFilter);

  const farmersResource = useResource<{ farmers: FarmerRecord[]; total: number }>(
    `/api/officer/farmers?${queryParams.toString()}`
  );
  const farmers = farmersResource.data?.farmers || [];
  const total = farmersResource.data?.total || 0;

  async function handleAddFarmer(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError("");

    try {
      const res = await api<{ id: string; action_link?: string; message: string }>("/api/officer/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setInviteSuccess({
        name: formData.display_name,
        link: res.action_link,
      });
      setShowAddModal(false);
      setFormData({
        display_name: "",
        email: "",
        region_id: regions[0]?.id || "",
        village: "",
        language: "en",
        phone: "",
        farm_size: "",
      });
      farmersResource.reload();
    } catch (err: any) {
      setActionError(err.message || "Failed to invite farmer. Please verify jurisdiction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(farmer: FarmerRecord) {
    const nextStatus = farmer.status === "suspended" ? "active" : "suspended";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Are you sure you want to suspend access for ${farmer.display_name}? They will not be able to log in.`
        : `Reactivate access for ${farmer.display_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api(`/api/officer/farmers/${farmer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      farmersResource.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update farmer status");
    }
  }

  return (
    <div className="farmer-mgmt-container pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeading
          eyebrow="Agricultural Officer"
          title="Farmer Administration"
          text="Enroll, provision, and supervise farmer accounts within your assigned regional jurisdiction."
        />
        <button
          type="button"
          onClick={() => {
            setActionError("");
            setInviteSuccess(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white font-medium text-[13px] tracking-wide shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add Farmer</span>
        </button>
      </div>

      {actionError && (
        <div className="mb-4">
          <Notice tone="error">{actionError}</Notice>
        </div>
      )}

      {inviteSuccess && (
        <div className="mb-6 p-4 rounded-[8px] bg-[#20292D] border border-[#a33715]/40 text-white shadow-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[14px]">
            <CheckCircle2 size={18} />
            <span>Farmer Account Provisioned: {inviteSuccess.name}</span>
          </div>
          <p className="text-[12.5px] text-[#B5A295]">
            The account is registered under your jurisdiction. If email delivery is active, an activation email has been queued.
          </p>
          {inviteSuccess.link && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteSuccess.link}
                className="w-full text-[11px] font-mono px-3 py-1.5 rounded bg-[#0A0F12] border border-white/10 text-white/90 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteSuccess.link!);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? "Copied" : "Copy Setup Link"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metric summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-[8px] bg-[#20292D]/70 border border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#B5A295]">Total Farmers</div>
          <div className="text-[22px] font-semibold text-white mt-0.5">{total}</div>
        </div>
        <div className="p-3.5 rounded-[8px] bg-[#20292D]/70 border border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#B5A295]">Active Accounts</div>
          <div className="text-[22px] font-semibold text-emerald-400 mt-0.5">
            {farmers.filter((f) => f.status === "active").length}
          </div>
        </div>
        <div className="p-3.5 rounded-[8px] bg-[#20292D]/70 border border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#B5A295]">Pending Activation</div>
          <div className="text-[22px] font-semibold text-amber-400 mt-0.5">
            {farmers.filter((f) => f.status === "invited" || f.status === "pending_activation").length}
          </div>
        </div>
        <div className="p-3.5 rounded-[8px] bg-[#20292D]/70 border border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#B5A295]">Suspended</div>
          <div className="text-[22px] font-semibold text-rose-400 mt-0.5">
            {farmers.filter((f) => f.status === "suspended").length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-[10px] bg-[#20292D]/80 border border-white/10 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5A295]" />
          <input
            type="text"
            placeholder="Search by name, village, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white placeholder:text-[#B5A295]/60 focus:outline-none focus:border-[#A33715]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[12.5px] text-white focus:outline-none"
          >
            <option value="">All Assigned Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[12.5px] text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited / Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            type="button"
            onClick={() => farmersResource.reload()}
            className="p-2 rounded-[6px] bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            title="Reload list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Farmers List Table */}
      <div className="rounded-[10px] overflow-hidden border border-white/10 bg-[#20292D]/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0A0F12]/60 text-[11px] font-mono uppercase tracking-wider text-[#B5A295]">
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Region / Village</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Monitored Plots</th>
                <th className="py-3 px-4">Enrollment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[13px] text-white/90">
              {farmers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#B5A295]">
                    {farmersResource.loading ? "Loading farmers..." : "No farmers found matching your criteria."}
                  </td>
                </tr>
              ) : (
                farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#394045] flex items-center justify-center font-semibold text-[13px] text-white shrink-0">
                          {farmer.display_name?.charAt(0).toUpperCase() || "F"}
                        </div>
                        <div>
                          <div className="font-medium text-white">{farmer.display_name}</div>
                          {farmer.phone && <div className="text-[11.5px] text-[#B5A295]">{farmer.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{farmer.regions?.name || "Assigned Region"}</div>
                      {farmer.village && <div className="text-[11.5px] text-[#B5A295]">{farmer.village}</div>}
                    </td>
                    <td className="py-3 px-4 uppercase text-[12px] font-mono text-[#B5A295]">
                      {farmer.language === "te" ? "Telugu" : farmer.language === "hi" ? "Hindi" : "English"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-white/5 text-[12px] font-mono">
                        <Sprout size={13} className="text-[#a33715]" />
                        <span>{farmer.plot_count || 0} plot(s)</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {farmer.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      )}
                      {(farmer.status === "invited" || farmer.status === "pending_activation") && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Invited</span>
                        </span>
                      )}
                      {farmer.status === "suspended" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(farmer)}
                        className={`text-[12px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                          farmer.status === "suspended"
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {farmer.status === "suspended" ? "Reactivate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Farmer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[500px] rounded-[12px] bg-[#20292D] border border-white/15 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
              <h3 className="text-[17px] font-medium text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#a33715]" />
                <span>Enroll New Farmer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#B5A295] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                  Farmer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none focus:border-[#A33715]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.field@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none focus:border-[#A33715]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                    Region Jurisdiction *
                  </label>
                  <select
                    required
                    value={formData.region_id}
                    onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                    Language Preference
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                    Village / Block
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tenali"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono uppercase text-[#B5A295] mb-1">
                  Farm Size / Primary Crops
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4.5 Acres (Chili, Cotton, Tomato)"
                  value={formData.farm_size}
                  onChange={(e) => setFormData({ ...formData, farm_size: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-white/15 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-[6px] text-[13px] text-[#B5A295] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white font-medium text-[13px] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Enrolling..." : "Enroll & Issue Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
