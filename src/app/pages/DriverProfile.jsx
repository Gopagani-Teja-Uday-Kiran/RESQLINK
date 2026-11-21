import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../utils/api";
import { auth } from "../utils/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Logo } from "../components/Logo";
import { toast } from "sonner";

export function DriverProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { (async () => { const [{ data }, result] = await Promise.all([auth.getUser(), api.getProfile()]); setEmail(data?.user?.email || ""); if (result.profile) setProfile(result.profile); })(); }, []);
  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const save = async (event) => { event.preventDefault(); setSaving(true); const result = await api.updateProfile({ driverName: profile.driverName, phone: profile.phone, ambulanceNumber: profile.ambulanceNumber }); setSaving(false); if (result.error) toast.error(result.error); else { setProfile(result.profile); toast.success("Driver profile saved."); } };
  return <main className="min-h-screen bg-slate-50 p-6 dark:bg-gray-950"><header className="mx-auto mb-6 flex max-w-3xl items-center justify-between"><Logo size="sm" variant="ambulance" showText /><Button variant="outline" onClick={() => navigate("/ambulance")}>Back to ambulance dashboard</Button></header><Card className="mx-auto max-w-3xl"><CardHeader><CardTitle>Driver profile</CardTitle></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Driver name<Input value={profile.driverName || profile.name || ""} onChange={(event) => update("driverName", event.target.value)} required /></label><label className="grid gap-1 text-sm">Phone<Input value={profile.phone || ""} onChange={(event) => update("phone", event.target.value)} /></label><label className="grid gap-1 text-sm">Ambulance number<Input value={profile.ambulanceNumber || ""} onChange={(event) => update("ambulanceNumber", event.target.value)} required /></label><label className="grid gap-1 text-sm">Account email<Input value={email} disabled /></label><div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Saving?" : "Save profile"}</Button></div></form><p className="mt-4 text-sm text-slate-600">Live location updates when this dashboard is open and location permission is granted.</p></CardContent></Card></main>;
}
