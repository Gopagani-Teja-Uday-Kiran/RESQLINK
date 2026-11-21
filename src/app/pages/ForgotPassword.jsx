import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../utils/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Logo } from "../components/Logo";
import { toast } from "sonner";

const STORAGE_KEY = "resqlink_password_reset";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [request, setRequest] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); }
    catch { return null; }
  });
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!request?.id || !request?.key) return;
    let cancelled = false;
    const checkStatus = async () => {
      const result = await api.getPasswordResetStatus(request.id, request.key);
      if (!cancelled && !result.error) setStatus(result.status || "");
    };
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [request?.id, request?.key]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = await api.requestPasswordReset(email);
    setBusy(false);
    if (result.error) { toast.error(result.error); return; }
    const nextRequest = result.request;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextRequest));
    setRequest(nextRequest);
    setStatus("pending");
    toast.success("Request sent for administrator review.");
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { toast.error("The passwords do not match."); return; }
    setBusy(true);
    const result = await api.completePasswordReset(request.id, request.key, password);
    setBusy(false);
    if (result.error) { toast.error(result.error); return; }
    sessionStorage.removeItem(STORAGE_KEY);
    setRequest(null);
    setStatus("completed");
    setPassword("");
    setConfirmPassword("");
    toast.success("Password changed. Sign in with your new password.");
  };

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-10 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <Card className="w-full max-w-lg border-orange-100 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="items-center text-center">
        <Logo size="md" variant="patient" showText={false} />
        <CardTitle className="text-2xl dark:text-white">Reset your password</CardTitle>
        <CardDescription className="dark:text-gray-400">An administrator must approve password changes for ResQLink accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "approved" ? <form onSubmit={submitPassword} className="space-y-4">
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Your request was approved. Choose a new password below.</p>
          <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" minLength={10} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" disabled={busy}>{busy ? "Saving..." : "Set new password"}</Button>
        </form> : status === "completed" ? <div className="space-y-4 text-center"><p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">Your password has been changed.</p><Button onClick={() => navigate("/login")} className="w-full">Go to sign in</Button></div> : request ? <div className="space-y-4">
          {status === "rejected" || status === "expired" ? <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">This request was {status}. Submit a new request if you still need help.</div> : <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900"><p className="font-semibold">Waiting for admin approval</p><p className="mt-1">This page checks for an update automatically. Keep it open; you can set your new password here after approval.</p></div>}
          {(status === "rejected" || status === "expired") && <Button variant="outline" onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setRequest(null); setStatus(""); }} className="w-full">Submit another request</Button>}
        </div> : <form onSubmit={submitRequest} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="reset-email">Account email</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500" disabled={busy}>{busy ? "Sending..." : "Request password reset"}</Button>
          <p className="text-center text-xs text-slate-500">Your request will appear in the admin panel for review.</p>
        </form>}
        <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate("/login")}>Back to sign in</Button>
      </CardContent>
    </Card>
  </main>;
}
