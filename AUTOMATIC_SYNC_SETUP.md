# 🎯 AUTOMATIC SYNC SETUP: Vetted → Congrats

## ✅ **What This Does**

Whenever you create a new project in Vetted:
1. Vetted database triggers webhook
2. Edge function looks up recruiter email
3. Sends data to Congrats
4. Congrats generates audition URL
5. URL is sent back to Vetted

---

## 🚀 **Step 1: Deploy the Edge Function**

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/vetted
chmod +x deploy-notify-congrats.sh
bash deploy-notify-congrats.sh
```

---

## 🔧 **Step 2: Configure Database Webhook**

### **2.1 Open Vetted's Supabase Dashboard**
Go to your Vetted project dashboard

### **2.2 Navigate to Webhooks**
- Click **"Database"** → **"Webhooks"**
- Click **"Create a new hook"** or **"Enable Webhooks"**

### **2.3 Fill in These Values:**

| Field | Value |
|-------|-------|
| **Name** | `sync_to_congrats` |
| **Table** | `projects` |
| **Events** | ☑️ INSERT (check this) |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `https://[YOUR-VETTED-REF].supabase.co/functions/v1/notify-congrats-new-project` |
| **HTTP Headers** | `Content-Type: application/json` |

**Find YOUR-VETTED-REF:**
- Go to Vetted Supabase → Settings → API
- Copy the "Project URL" middle part (e.g., `lagvszfwsruniuinxdjb`)

---

## 🧪 **Step 3: Test It**

### **3.1 Create a Test Project in Vetted**
Just create any project through your UI

### **3.2 Check Congrats Database**
Run this in Congrats Supabase SQL Editor:
```sql
SELECT 
    vetted_project_id,
    project_title,
    recruiter_email,
    audition_url,
    created_at
FROM vetted_projects
ORDER BY created_at DESC
LIMIT 5;
```

You should see your new project! ✅

---

## 📊 **Flow Diagram**

```
User creates project in Vetted UI
    ↓
Vetted DB: INSERT into projects table
    ↓
Database Webhook triggers
    ↓
Edge Function: notify-congrats-new-project
    ├─ Fetch recruiter email from recruiters table
    ├─ Build payload with email
    └─ POST to Congrats webhook
        ↓
Congrats: fn_receive_new_project
    ├─ Generate audition URL
    ├─ Save to vetted_projects table
    └─ Return URL
        ↓
Vetted Edge Function receives URL
    └─ (Optional) Save URL back to Vetted
```

---

## 🔍 **Troubleshooting**

### Check Vetted Function Logs
```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/vetted
supabase functions logs notify-congrats-new-project
```

### Check Congrats Function Logs
```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
supabase functions logs fn_receive_new_project
```

### Common Issues

**"Function not found"**
→ Deploy the function first: `bash deploy-notify-congrats.sh`

**"Recruiter email not found"**
→ Check that recruiter exists in `recruiters` table

**"Congrats webhook failed"**
→ Check Congrats database has `vetted_projects` table

---

## ✅ **Success Checklist**

- [ ] Edge function deployed in Vetted
- [ ] Database webhook configured
- [ ] Test project created
- [ ] Project appears in Congrats `vetted_projects` table
- [ ] Audition URL generated

---

## 🎉 **Once Set Up:**

Every new project in Vetted will **automatically**:
✅ Sync to Congrats  
✅ Generate an audition URL  
✅ Be ready for candidates

**No manual work needed!** 🚀
