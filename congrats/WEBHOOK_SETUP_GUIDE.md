# 🚀 Setup Automatic Sync: Vetted → Congrats

## ✅ **Step-by-Step Webhook Configuration**

### **Step 1: Open Vetted's Supabase Dashboard**
Go to: https://supabase.com/dashboard (select your Vetted project)

### **Step 2: Navigate to Webhooks**
1. Click **"Database"** in the left sidebar
2. Click **"Webhooks"**
3. Click **"Create a new hook"** or **"Enable Webhooks"**

### **Step 3: Configure the Webhook**

Fill in these exact values:

| Field | Value |
|-------|-------|
| **Name** | `notify_congrats_new_project` |
| **Table** | `projects` |
| **Events** | ☑️ INSERT (check this box) |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_new_project` |
| **HTTP Headers** | `Content-Type: application/json` |
| **Timeout** | 5000 (ms) |

### **Step 4: Configure the Payload**

In the "Webhook Payload" section, you need to map Vetted's columns to what Congrats expects:

**Payload Template:**
```json
{
  "project_id": "{{record.id}}",
  "project_title": "{{record.role_title}}",
  "recruiter_email": "{{record.recruiter_id}}",
  "recruiter_name": null
}
```

**⚠️ WAIT!** We need recruiter email, not ID. Let me check if we need a custom payload...

---

## 🔧 **Alternative: Use Edge Function (Recommended)**

Since Vetted stores `recruiter_id` but Congrats needs `recruiter_email`, we need to look it up first.

### **Option A: Supabase Webhook with Edge Function Transform**

Instead of calling Congrats directly, create an edge function in Vetted that:
1. Gets the project data
2. Looks up recruiter email
3. Calls Congrats webhook

Would you like me to create this edge function for you?

---

## 🎯 **Or Simpler: Modify Congrats to Accept recruiter_id**

We could change the Congrats webhook to accept `recruiter_id` and look up the email later.

Which approach do you prefer?

**Option 1:** I create a Vetted edge function to transform the data  
**Option 2:** I modify Congrats webhook to accept recruiter_id instead of email

Let me know and I'll implement it! 🚀
