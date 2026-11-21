import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";

export function EmailConfigStatus() {
  return <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"><Info className="h-4 w-4 text-blue-600 dark:text-blue-400" /><AlertTitle>Email and SMS delivery</AlertTitle><AlertDescription>In-app alerts are available now. Configure EmailJS and Twilio credentials in the project .env file to send emergency contact emails and text messages. See <a className="underline" href="/NOTIFICATIONS.md" target="_blank" rel="noreferrer">notification setup</a>.</AlertDescription></Alert>;
}
