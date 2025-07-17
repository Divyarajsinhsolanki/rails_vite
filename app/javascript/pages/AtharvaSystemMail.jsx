import React from "react";

const AtharvaSystemMail = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Atharva System Mail - Add me to aslack channel</h1>
    <pre className="whitespace-pre-wrap text-sm">
{`
Based on the document titled "Atharva System Mail - Add me to aslack channel", it outlines a project roadmap for a system combining:

Claude AI
Supabase (as a backend/CRM)
Email/SMS integration
Instagram DMs automation

Here’s a detailed step-by-step implementation guide with full code examples using modern tech stacks like React, Supabase, Twilio, and Resend:

1. Opt-in Pages (Frontend + Backend)
Goal:
Create a form collecting: name, email, phone, IG handle, keyword.
Stack:
Frontend: React + Tailwind CSS
Backend: Supabase (PostgreSQL + REST API)
Step 1: Set up Supabase
Go to https://supabase.com and create a new project.
Create a table named fans with columns:

CREATE TABLE fans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  ig_handle text,
  keyword text,
  tags text[],
  events jsonb,
  last_engaged timestamp
);

Step 2: React Opt-in Form

// FanForm.jsx
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://<project>.supabase.co", "<anon-key>");

export default function FanForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", ig_handle: "", keyword: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from("fans").insert([formData]);
    if (error) alert("Error saving: " + error.message);
    else alert("Fan saved!");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 max-w-md mx-auto">
      {["name", "email", "phone", "ig_handle", "keyword"].map((field) => (
        <input
          key={field}
          name={field}
          value={formData[field]}
          onChange={handleChange}
          placeholder={field.replace("_", " ")}
          className="w-full p-2 border rounded"
          required
        />
      ))}
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">Submit</button>
    </form>
  );
}

2. Supabase as CRM
Goal:
Basic dashboard to view and tag fans.
Step 3: Admin Dashboard
Use Supabase’s built-in Table Editor or build a simple dashboard with filters using React + Supabase queries:

const { data: fans } = await supabase.from("fans").select("*").like("tags", "%VIP%");

Step 4: Add API handlers (Optional)
Example: Node.js edge function to update tags

// /api/updateTag.js
import { createClient } from '@supabase/supabase-js';

export default async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { fanId, newTag } = req.body;

  const { data, error } = await supabase
    .from('fans')
    .update({ tags: Supabase.raw('array_append(tags, ?)', [newTag]) })
    .eq('id', fanId);

  if (error) return res.status(500).json({ error });
  res.status(200).json(data);
};

3. Email + SMS Notifications
Goal:
Send reminders and follow-ups based on events.
Step 5: Resend (Email)
Install Resend SDK:

npm install resend

Send email on event:

import { Resend } from "resend";
const resend = new Resend("RESEND_API_KEY");

await resend.emails.send({
  from: "noreply@yourdomain.com",
  to: "fan@example.com",
  subject: "Thanks for Presaving!",
  html: "<p>You’ve successfully presaved the drop. Stay tuned!</p>"
});

Step 6: Twilio for SMS

const twilio = require('twilio')(accountSid, authToken);
await twilio.messages.create({
  body: "Hey! Your drop is ready.",
  from: "+1234567890",
  to: "+1987654321"
});

4. Instagram DMs
Goal:
Auto-reply or log DMs from fans using Meta API or tools like Inrō.
Step 7: Inrō / LinktoDM Integration
Connect IG Business account to Meta App.
Set keyword-based replies on Inrō.
Use webhook to receive DM events.
Webhook handler:

app.post('/webhook/ig', async (req, res) => {
  const { ig_handle, message } = req.body;

  await supabase.from("fans").update({
    events: Supabase.raw(`jsonb_set(events, '{dm_received}', to_jsonb(now()))`),
    last_engaged: new Date()
  }).eq("ig_handle", ig_handle);

  res.status(200).send("Logged.");
});

Bonus: Automation & Templates
Landing Pages: Use Claude or React to export static HTML.
Email Templates: Use MJML or Tailwind Email.
Event Cron Jobs: Use Supabase scheduled functions or external cron + scripts.

Automation JSON:
{
  "trigger": "fan.presaved = true",
  "action": "send_email",
  "delay_days": 3
}
`}
    </pre>
  </div>
);

export default AtharvaSystemMail;
