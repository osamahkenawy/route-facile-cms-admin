# Fix for jsPDF Module Not Found Error in Production

The error `Cannot find module 'jspdf'` is occurring because the production server doesn't have the new PDF generation packages installed.

## Steps to Fix:

1. **SSH into your production server**
   ```bash
   ssh ubuntu@your-server-ip
   ```

2. **Navigate to the admin project directory**
   ```bash
   cd /home/ubuntu/admin
   ```

3. **Pull the latest changes** (if not already done)
   ```bash
   sudo git pull
   ```

4. **Install the new dependencies**
   ```bash
   sudo npm install
   ```
   
   This will install:
   - `jspdf` (^2.5.2)
   - `jspdf-autotable` (^3.8.4)
   - `xlsx` (if you also added Excel export)

5. **Build the production version**
   ```bash
   sudo npm run build
   ```

6. **Restart the application**
   
   If using PM2:
   ```bash
   sudo pm2 restart all
   ```
   
   Or if using a different process manager, restart accordingly.

## Alternative Quick Fix (if urgent):

If you need a quick fix without server access, you can temporarily remove the PDF/Excel functionality:

1. Comment out the imports in `Bookings.js`:
   ```javascript
   // import jsPDF from "jspdf";
   // import autoTable from "jspdf-autotable";
   // import * as XLSX from "xlsx";
   ```

2. Disable the download buttons or show an alert instead of generating PDFs.

## Verification:

After completing the steps, the PDF and Excel download buttons should work properly without any module errors.








