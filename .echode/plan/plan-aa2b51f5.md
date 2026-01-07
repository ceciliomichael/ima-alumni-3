# Customize Donation Report Signatory

## Overview
We will allow the admin to customize the signatory details (Name, Title, Organization, Address) for the donation report PDF and remove the "Prepared by" section. The signatory details will be persistent using `localStorage`. We will also extract the settings UI into a separate component to improve code modularity.

## Architecture
- **Data Model**: Add `ReportSignatory` interface to `src/types/index.ts`.
- **UI Component**: Create `src/pages/Admin/components/DonationReports/SignatorySettingsModal.tsx` for editing details.
- **Main Page**: Update `DonationReports.tsx` to manage the modal state and load/save settings from `localStorage`.
- **Export Utility**: Update `src/utils/exportUtils.ts` to accept the signatory configuration and render the dynamic signature block.

## Step-by-Step Implementation

### 1. Define Types
**File:** `src/types/index.ts`
- Add `ReportSignatory` interface:
  ```typescript
  export interface ReportSignatory {
    name: string;
    title: string;
    organization: string;
    address: string;
  }
  ```

### 2. Create Settings Modal Component
**File:** `src/pages/Admin/components/DonationReports/SignatorySettingsModal.tsx`
- Create a new component that accepts `isOpen`, `onClose`, `onSave`, and `initialData`.
- Implement a form with 4 inputs (Name, Title, Org, Address).
- Use `DonationReports.css` for styling (or add specific styles if needed).

### 3. Update Export Utility
**File:** `src/utils/exportUtils.ts`
- Update `exportReportToPDF` signature:
  ```typescript
  export const exportReportToPDF = (report: DonationReport, signatory?: ReportSignatory): void => { ... }
  ```
- In the HTML template:
  - **Remove** the "Prepared by" signature block (left side).
  - **Update** the right signature block to use values from `signatory` (with fallbacks to current defaults if undefined).
  - Ensure the layout centers the single remaining signature block or keeps it aligned right as preferred (User asked to "fit it on white spaces", usually a single signature is right-aligned or centered at the bottom). We will align it to the right for a professional look, or keep the flex layout but with only one item.

### 4. Update Donation Reports Page
**File:** `src/pages/Admin/components/DonationReports/DonationReports.tsx`
- Import `ReportSignatory` and the new modal.
- Add state:
  ```typescript
  const [showSettings, setShowSettings] = useState(false);
  const [signatory, setSignatory] = useState<ReportSignatory>({
    name: 'HON. MARIANO L. MAGLAHUS JR.',
    title: 'Alumni President',
    organization: 'Immaculate Mary Academy',
    address: 'Poblacion Weste, Catigbian, Bohol'
  });
  ```
- `useEffect`: Load saved settings from `localStorage.getItem('donationReportSignatory')` on mount.
- `handleSaveSettings`: Update state and `localStorage.setItem`.
- Add a "Settings" button (using `Settings` icon from lucide-react) next to the Export button.
- Update `handleExportPDF` to pass `signatory` to `exportReportToPDF`.

### 5. Styles
**File:** `src/pages/Admin/components/DonationReports/DonationReports.css`
- Add styles for the modal (overlay, content, form groups) if existing global modal styles aren't available.

## Edge Cases
- **Empty Fields**: Allow empty fields (e.g., if they don't want an address line).
- **Persistence**: Ensure data persists across reloads via `localStorage`.
- **Backward Compatibility**: If no settings are saved, fallback to the current hardcoded values.