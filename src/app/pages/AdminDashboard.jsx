import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../utils/api";
import { auth } from "../utils/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Building2, UserRound, Ambulance, KeyRound } from "lucide-react";
import { toast } from "sonner";

const sections = [
  { role: "hospital", label: "Hospitals", icon: Building2 },
  { role: "patient", label: "Patients", icon: UserRound },
  { role: "ambulance", label: "Ambulances", icon: Ambulance },
  { role: "password-resets", label: "Password requests", icon: KeyRound },
];

const fields = {
  hospital: [
    { key: "name", label: "Account contact name" }, { key: "hospitalName", label: "Hospital name" },
    { key: "hospitalAddress", label: "Hospital address", wide: true }, { key: "phone", label: "Phone" },
    { key: "capacity", label: "Total beds", type: "number" }, { key: "availableBeds", label: "Available beds", type: "number" },
    { key: "icuBeds", label: "Total ICU beds", type: "number" }, { key: "availableIcu", label: "Available ICU beds", type: "number" },
    { key: "latitude", label: "Latitude", type: "number" }, { key: "longitude", label: "Longitude", type: "number" },
  ],
  patient: [
    { key: "name", label: "Full name" }, { key: "phone", label: "Phone" }, { key: "bloodGroup", label: "Blood group" },
    { key: "allergies", label: "Allergies (one per line)", type: "list", wide: true },
    { key: "medicalConditions", label: "Medical conditions (one per line)", type: "list", wide: true },
    { key: "emergencyContacts", label: "Emergency contacts", type: "contacts", wide: true },
  ],
  ambulance: [
    { key: "name", label: "Account contact name" }, { key: "driverName", label: "Driver name" },
    { key: "ambulanceNumber", label: "Ambulance number" }, { key: "phone", label: "Phone" },
    { key: "hospitalId", label: "Assigned hospital", type: "hospital" },
    { key: "available", label: "Available for calls", type: "boolean" },
    { key: "latitude", label: "Latitude", type: "number" }, { key: "longitude", label: "Longitude", type: "number" },
  ],
};

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "object" ? Object.values(item).filter(Boolean).join(" - ") : item).join(", ") : "None";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("hospital");
  const [accounts, setAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [hospitalChoices, setHospitalChoices] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [profileDraft, setProfileDraft] = useState({});

  useEffect(() => {
    let cancelled = false;
    auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const role = data?.user?.user_metadata?.role;
      if (role !== "admin") navigate("/login", { replace: true });
      else { setIsAdmin(true); loadAccounts("hospital"); }
    });
    return () => { cancelled = true; };
  }, []);

  const loadAccounts = async (role) => {
    setLoadingAccounts(true);
    setEditingId(null);
    const result = await api.getAdminAccounts(role);
    setLoadingAccounts(false);
    if (result.error) toast.error(result.error);
    else setAccounts(result.accounts || []);
    if (role === "ambulance") {
      const hospitals = await api.getAdminAccounts("hospital");
      if (!hospitals.error) setHospitalChoices(hospitals.accounts || []);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    const result = await api.getPasswordResetRequests();
    setLoadingRequests(false);
    if (result.error) toast.error(result.error);
    else setRequests(result.requests || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadRequests();
    const timer = setInterval(loadRequests, 5000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  const selectSection = (role) => {
    setSection(role);
    if (role === "password-resets") loadRequests();
    else loadAccounts(role);
  };

  const beginEdit = (account) => {
    setEditingId(account.userId);
    setEmailDraft(account.email);
    const initial = { ...account.profile };
    for (const field of fields[section] || []) {
      if (field.type === "list") initial[field.key] = (initial[field.key] || []).join("\n");
    }
    setProfileDraft(initial);
  };

  const updateContact = (index, key, value) => setProfileDraft((current) => ({ ...current, emergencyContacts: (current.emergencyContacts || []).map((contact, contactIndex) => contactIndex === index ? { ...contact, [key]: value } : contact) }));
  const addContact = () => setProfileDraft((current) => ({ ...current, emergencyContacts: [...(current.emergencyContacts || []), { name: "", phone: "", email: "", relationship: "family" }] }));
  const removeContact = (index) => setProfileDraft((current) => ({ ...current, emergencyContacts: (current.emergencyContacts || []).filter((_, contactIndex) => contactIndex !== index) }));

  const saveEdit = async (userId) => {
    const updated = { ...profileDraft };
    for (const field of fields[section] || []) {
      if (field.type === "number") updated[field.key] = updated[field.key] === "" ? null : Number(updated[field.key]);
      if (field.type === "list") updated[field.key] = String(updated[field.key] || "").split("\n").map((item) => item.trim()).filter(Boolean);
    }
    const result = await api.updateAdminAccount({ userId, email: emailDraft, profile: updated });
    if (result.error) toast.error(result.error);
    else {
      setAccounts((current) => current.map((account) => account.userId === userId ? result.account : account));
      setEditingId(null);
      toast.success("Account changes saved.");
    }
  };

  const removeAccount = async (account) => {
    const title = account.profile?.hospitalName || account.profile?.name || account.profile?.ambulanceNumber || account.email;
    if (!window.confirm(`Remove ${title}'s account? This cannot be undone.`)) return;
    const result = await api.removeAdminAccount(account.userId);
    if (result.error) toast.error(result.error);
    else {
      setAccounts((current) => current.filter((item) => item.userId !== account.userId));
      toast.success("Account removed.");
    }
  };

  const reviewRequest = async (requestId, action) => {
    const result = await api.reviewPasswordResetRequest(requestId, action);
    if (result.error) toast.error(result.error);
    else {
      toast.success(action === "approve" ? "Password reset approved." : "Request declined.");
      loadRequests();
    }
  };

  const logout = async () => {
    await auth.signOut();
    navigate("/login", { replace: true });
  };

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-2xl text-white shadow-lg">R</div><div><h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ResQLink Admin Panel</h1><p className="text-sm text-slate-500 dark:text-gray-400">Account and access management</p></div></div>
        <Button variant="outline" onClick={logout}>Sign out</Button>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-7 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Admin sections">
        {sections.map((item) => <button key={item.role} onClick={() => selectSection(item.role)} className={`relative flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold shadow-sm transition sm:justify-start sm:px-4 ${section === item.role ? "border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-200" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"}`}><item.icon className="h-4 w-4" aria-hidden="true" />{item.label}{item.role === "password-resets" && pendingCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{pendingCount}</span>}</button>)}
      </nav>

      {section === "password-resets" ? <Card className="overflow-hidden border-slate-200 shadow-md dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="border-b border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900"><CardTitle className="flex items-center justify-between text-slate-900 dark:text-white"><span>Password reset requests</span><span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">{pendingCount} pending</span></CardTitle><p className="text-sm text-slate-500 dark:text-gray-400">Approve a request to let its owner set a new password from their open reset page.</p></CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loadingRequests ? <p className="py-10 text-center text-slate-500">Loading requests...</p> : requests.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-gray-700">No password reset requests.</div> : <div className="space-y-3">{requests.map((request) => <article key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950"><div><p className="font-semibold text-slate-900 dark:text-white">{request.email}</p><p className="mt-1 text-xs text-slate-500">Requested {new Date(request.createdAt).toLocaleString()} · {request.accountExists ? "Account found" : "No matching account"}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "pending" ? "bg-amber-100 text-amber-800" : request.status === "approved" ? "bg-green-100 text-green-800" : request.status === "rejected" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{request.status}</span></div>{request.status === "pending" && <div className="flex gap-2"><Button disabled={!request.accountExists} onClick={() => reviewRequest(request.id, "approve")} className="bg-green-600 hover:bg-green-700">Approve</Button><Button variant="outline" onClick={() => reviewRequest(request.id, "reject")} className="border-red-200 text-red-700 hover:bg-red-50">Decline</Button></div>}</article>)}</div>}
        </CardContent>
      </Card> : <Card className="overflow-hidden border-slate-200 shadow-md dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="border-b border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900"><CardTitle className="text-slate-900 dark:text-white">{sections.find((item) => item.role === section)?.label} <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">{accounts.length}</span></CardTitle><p className="text-sm text-slate-500 dark:text-gray-400">Review account details, update profile information, or remove an account.</p></CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loadingAccounts ? <p className="py-10 text-center text-slate-500">Loading accounts...</p> : accounts.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-gray-700">No {section} accounts found.</div> : <div className="grid gap-4 lg:grid-cols-2">{accounts.map((account) => <article key={account.userId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-gray-900"><div className="min-w-0"><h2 className="truncate font-bold text-slate-900 dark:text-white">{account.profile?.hospitalName || account.profile?.name || account.profile?.ambulanceNumber || account.email}</h2><p className="truncate text-sm text-slate-500">{account.email}</p></div><span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold capitalize text-orange-800 dark:bg-orange-950 dark:text-orange-300">{section}</span></div>
            {editingId === account.userId ? <div className="space-y-4 p-4">
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Account email</label><input className={inputClass} type="email" value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">{fields[section].map((field) => <label key={field.key} className={`block text-xs font-semibold text-slate-600 dark:text-gray-300 ${field.wide ? "sm:col-span-2" : ""}`}>{field.label}{field.type === "boolean" ? <select className={`${inputClass} mt-1`} value={String(profileDraft[field.key] ?? false)} onChange={(event) => setProfileDraft({ ...profileDraft, [field.key]: event.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select> : field.type === "hospital" ? <select className={`${inputClass} mt-1`} value={profileDraft.hospitalId || ""} onChange={(event) => setProfileDraft({ ...profileDraft, hospitalId: event.target.value })}><option value="">No hospital</option>{hospitalChoices.map((hospital) => <option key={hospital.userId} value={hospital.userId}>{hospital.profile?.hospitalName || hospital.email}</option>)}</select> : field.type === "contacts" ? <div className="mt-2 space-y-2">{(profileDraft.emergencyContacts || []).map((contact, index) => <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2 dark:border-gray-700"><input className={inputClass} aria-label={`Contact ${index + 1} name`} placeholder="Name" value={contact.name || ""} onChange={(event) => updateContact(index, "name", event.target.value)} /><input className={inputClass} aria-label={`Contact ${index + 1} phone`} placeholder="Phone" value={contact.phone || ""} onChange={(event) => updateContact(index, "phone", event.target.value)} /><input className={inputClass} aria-label={`Contact ${index + 1} email`} placeholder="Email" value={contact.email || ""} onChange={(event) => updateContact(index, "email", event.target.value)} /><select className={inputClass} aria-label={`Contact ${index + 1} relationship`} value={contact.relationship || "family"} onChange={(event) => updateContact(index, "relationship", event.target.value)}><option value="family">Family</option><option value="friend">Friend</option><option value="colleague">Colleague</option><option value="doctor">Doctor</option><option value="other">Other</option></select><button type="button" onClick={() => removeContact(index)} className="text-left text-xs font-semibold text-red-700 hover:underline">Remove contact</button></div>)}<button type="button" onClick={addContact} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-300">+ Add emergency contact</button></div> : field.type === "list" || field.wide ? <textarea className={`${inputClass} mt-1 min-h-20`} value={profileDraft[field.key] ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, [field.key]: event.target.value })} /> : <input className={`${inputClass} mt-1`} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} value={profileDraft[field.key] ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, [field.key]: event.target.value })} />}</label>)}</div>
              <div className="flex flex-wrap gap-2"><Button onClick={() => saveEdit(account.userId)} className="bg-gradient-to-r from-orange-500 to-red-500">Save changes</Button><Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button></div>
              </div> : <div className="p-4"><div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{fields[section].slice(0, 6).map((field) => <div key={field.key} className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label.replace(/ \(.*\)/, "")}</p><p className="break-words text-sm font-medium text-slate-700 dark:text-gray-200">{field.key === "hospitalId" ? (hospitalChoices.find((hospital) => hospital.userId === account.profile?.hospitalId)?.profile?.hospitalName || account.profile?.hospitalName || "Unassigned") : displayValue(account.profile?.[field.key])}</p></div>)}</div><details className="mt-4 border-t border-slate-100 pt-3 dark:border-gray-800"><summary className="cursor-pointer text-xs font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400">More account details</summary><div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">{Object.entries(account.profile || {}).filter(([key]) => !["userId", "email", "name", "hospitalName", "hospitalId", "hospitalAddress", "phone", "capacity", "availableBeds", "icuBeds", "availableIcu", "ambulanceNumber", "driverName", "bloodGroup", "allergies", "medicalConditions", "emergencyContacts"].includes(key)).map(([key, value]) => <div key={key}><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p><p className="break-words text-sm text-slate-700 dark:text-gray-200">{displayValue(value)}</p></div>)}</div></details><div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-gray-800"><Button variant="outline" size="sm" onClick={() => beginEdit(account)}>Edit account</Button><Button variant="outline" size="sm" onClick={() => removeAccount(account)} className="border-red-200 text-red-700 hover:bg-red-50">Remove account</Button></div></div>}
          </article>)}</div>}
        </CardContent>
      </Card>}
    </div>
  </main>;
}
