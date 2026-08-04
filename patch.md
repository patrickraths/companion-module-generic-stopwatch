

**Issue:**
This confirms it: the variable representing the time object is e, and the minifier used void 0 instead of undefined.

The reason you see e=e.getTime() just before the formatting is because the module is saving the "raw" timestamp to the system (self.targetTime) while simultaneously using the Date object (e) to create the text for your button.

Here are the exact sed commands to fix your main.js. I have updated them to match the void 0 and the exact syntax from your terminal snippet.

**What these commands do:**
- **Targeting:** They find the exact string e.toLocaleTimeString(void 0, ...) that is causing the UTC bug.
- **Replacement:** * 24h: Uses e.getHours(), e.getMinutes(), and e.getSeconds() (which respect your Hong Kong timezone) and joins them with colons.
    - **12h:** Performs the "AM/PM" math manually. It uses the modulo operator % 12 to convert 13-23 into 1-11 and checks if the hour is >= 12 to append "AM" or "PM".
- **Inline Edit:** The -i flag saves the changes directly to main.js.


```Bash
cd /opt/services/companion/config/modules/generic-stopwatch-1.3.1

# Fix the 24hour calculation
sudo sed -i 's/e.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1})/[e.getHours(),e.getMinutes(),e.getSeconds()].map(v=>v.toString().padStart(2,"0")).join(":")/g' main.js

# Fix the 12hour calculation
sudo sed -i 's/e.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})/((e.getHours()+11)%12+1).toString().padStart(2,"0")+":"+e.getMinutes().toString().padStart(2,"0")+":"+e.getSeconds().toString().padStart(2,"0")+(e.getHours()>=12?" PM":" AM")/g' main.js
```