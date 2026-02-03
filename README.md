# Bundle Management Frontend

A React-based admin dashboard for managing educational bundles, rows, and vouchers.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **AG Grid Community** - Data tables with filtering, sorting, pagination
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/          # React components
│   ├── BundlesList.jsx       # Bundles management with AG Grid
│   ├── RowsManager.jsx       # Rows management with bundle assignment
│   ├── VouchersManager.jsx   # Voucher generation and management
│   ├── FilterSidebar.jsx     # Hierarchical filter (Country > Curriculum > Grade)
│   ├── CreateBundleModal.jsx # Bundle creation form
│   ├── EditBundleModal.jsx   # Bundle editing form
│   └── ...
├── context/             # React contexts
│   ├── SubjectContext.jsx    # Selected subject/grade state
│   └── ToastContext.jsx      # Toast notifications
├── services/
│   └── api.js               # API client with all endpoints
└── main.jsx             # App entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd src/frontend
npm install
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Output in `dist/` folder.

## Features

### Bundles Management

- View all bundles in AG Grid with filtering and sorting
- Create, edit, delete bundles
- Toggle bundle activation status
- View bundle details with assigned services
- Stats: Total, Active, Inactive, Total Value

### Rows Management

- Create rows to organize bundles for display
- Assign bundles to rows with drag-and-drop ordering
- Reorder bundles within rows
- Toggle row activation status

### Vouchers Management

- Generate vouchers for bundles
- View vouchers with AG Grid (filtering by bundle, status, date)
- Copy voucher codes to clipboard
- Bulk activate/deactivate vouchers
- Export vouchers to Excel
- Stats: Total, Available, Used, Inactive

### Hierarchical Filtering

Filter data by:
1. Country
2. Curriculum
3. Stage
4. Grade
5. Subject

## API Integration

All API calls are in `src/services/api.js`:

```javascript
// Bundles
bundlesApi.getAll(page, pageSize, gradeId)
bundlesApi.create(data)
bundlesApi.update(id, data)
bundlesApi.delete(id)
bundlesApi.setActive(id, isActive)
bundlesApi.generateVouchers(bundleId, count)

// Rows
rowsApi.getAll(page, pageSize, gradeId)
rowsApi.create(data)
rowsApi.assignBundles(rowId, bundleAssignments)
rowsApi.reorderBundles(rowId, bundleOrders)

// Vouchers
vouchersApi.getByBundle(bundleId)
vouchersApi.exportToExcel(gradeId, bundleGuids, createdFrom, createdTo, isUsed)
vouchersApi.bulkActivate(voucherIds)
vouchersApi.bulkDeactivate(voucherIds)

// Filters
filtersApi.getCountries()
filtersApi.getCurriculums(countryId)
filtersApi.getStages(curriculumId)
filtersApi.getGrades(stageId)
filtersApi.getSubjects(gradeId)
```

## AG Grid Configuration

All data tables use AG Grid Community with:

- **Floating filters** - Filter inputs below column headers
- **Column sorting** - Click headers to sort
- **Pagination** - 10, 20, 50, 100 rows per page
- **Row selection** - Checkbox selection for bulk operations
- **Custom cell renderers** - Status badges, action buttons

Example column definition:

```javascript
{
  headerName: 'Status',
  field: 'is_active',
  filter: 'agSetColumnFilter',
  floatingFilter: true,
  cellRenderer: (params) => (
    <span className={params.value ? 'badge-success' : 'badge-danger'}>
      {params.value ? 'Active' : 'Inactive'}
    </span>
  )
}
```

## Authentication

JWT token stored in `localStorage`:

```javascript
localStorage.getItem('authToken')
```

Auto-redirect to `/login` on 401 responses.

## Styling

- CSS custom properties for theming
- Responsive design with mobile breakpoints
- AG Grid `ag-theme-quartz` theme with custom overrides

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
