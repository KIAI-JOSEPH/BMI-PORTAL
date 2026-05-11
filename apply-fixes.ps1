# BMI Portal - Critical Security & Architecture Fixes
# Run from BMI-PORTAL root: powershell -ExecutionPolicy Bypass -File apply-fixes.ps1

Write-Host "=== Applying Critical Security & Architecture Fixes ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# FIX 1: AI Modal PII Data Leak (CRITICAL)
# ============================================================
Write-Host "[1/15] Fixing AI Modal PII data leak..." -ForegroundColor Yellow
$file = "src/components/AIModal.tsx"
$lines = Get-Content $file
$newLines = [System.Collections.ArrayList]::new()
$skipMode = $false
foreach ($line in $lines) {
    if ($line -match 'const getLS = \(key: string\) =>') {
        $skipMode = $true
        $newLines.Add('const getLSCount = (key: string): number => {') | Out-Null
        $newLines.Add('    try {') | Out-Null
        $newLines.Add('        const raw = localStorage.getItem(key);') | Out-Null
        $newLines.Add('        if (!raw) return 0;') | Out-Null
        $newLines.Add('        const data = JSON.parse(raw);') | Out-Null
        $newLines.Add('        return Array.isArray(data) ? data.length : 0;') | Out-Null
        $newLines.Add('    } catch {') | Out-Null
        $newLines.Add('        return 0;') | Out-Null
        $newLines.Add('    }') | Out-Null
        $newLines.Add('};') | Out-Null
        continue
    }
    if ($skipMode -and $line -match '^\};') {
        $skipMode = $false
        continue
    }
    if ($skipMode) { continue }

    # Replace systemData raw data with counts
    $line = $line -replace "getLS\('bmi_data_students'\)", "getLSCount('bmi_data_students')"
    $line = $line -replace "getLS\('bmi_data_staff'\)", "getLSCount('bmi_data_staff')"
    $line = $line -replace "getLS\('bmi_data_transactions'\)", "getLSCount('bmi_data_transactions')"
    $line = $line -replace "getLS\('bmi_data_courses'\)", "getLSCount('bmi_data_courses')"
    $line = $line -replace "getLS\('bmi_data_library'\)", "getLSCount('bmi_data_library')"

    $newLines.Add($line) | Out-Null
}
$content = $newLines -join "`n"

# Replace institutionalContext
$oldPattern = 'const institutionalContext = `[\s\S]*?`;'
$newContext = @'
const institutionalContext = `You are the BMI Portal AI Assistant. Institutional data summary: ${systemData.students} students, ${systemData.staff} staff, ${systemData.courses} courses, ${systemData.finance} transactions, ${systemData.library} library items. Answer questions based on general knowledge about university management. Do not reveal any personal information.`);
'@
$content = $content -replace $oldPattern, $newContext

Set-Content $file $content -NoNewline
Write-Host "  -> AI Modal PII leak patched" -ForegroundColor Green

# ============================================================
# FIX 2: Fake Password Change in Settings (CRITICAL)
# ============================================================
Write-Host "[2/15] Fixing fake password change in Settings..." -ForegroundColor Yellow
$file = "src/components/Settings.tsx"
$lines = Get-Content $file
$newLines = [System.Collections.ArrayList]::new()
$addedImport = $false
$inPasswordFunc = $false
$braceCount = 0

foreach ($line in $lines) {
    # Add authFetch import
    if (-not $addedImport -and $line -match "^import.*from.*';$") {
        $newLines.Add($line) | Out-Null
        if (-not ($content -match "authFetch")) {
            $newLines.Add("import { authFetch } from '../services/authService';") | Out-Null
        }
        $addedImport = $true
        continue
    }

    # Detect handlePasswordUpdate start
    if ($line -match 'const handlePasswordUpdate = \(') {
        $inPasswordFunc = $true
        $braceCount = 0
        # Insert new function
        $newLines.Add('    const handlePasswordUpdate = async () => {') | Out-Null
        $newLines.Add("        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {") | Out-Null
        $newLines.Add("            setToastMessage('Please fill in all password fields');") | Out-Null
        $newLines.Add('            return;') | Out-Null
        $newLines.Add('        }') | Out-Null
        $newLines.Add("        if (passwordForm.newPassword !== passwordForm.confirmPassword) {") | Out-Null
        $newLines.Add("            setToastMessage('Passwords do not match');") | Out-Null
        $newLines.Add('            return;') | Out-Null
        $newLines.Add('        }') | Out-Null
        $newLines.Add("        if (passwordForm.newPassword.length < 8) {") | Out-Null
        $newLines.Add("            setToastMessage('Password must be at least 8 characters');") | Out-Null
        $newLines.Add('            return;') | Out-Null
        $newLines.Add('        }') | Out-Null
        $newLines.Add('        setIsLoading(true);') | Out-Null
        $newLines.Add('        try {') | Out-Null
        $newLines.Add("            const response = await authFetch('/api/v1/auth/change-password', {") | Out-Null
        $newLines.Add("                method: 'POST',") | Out-Null
        $newLines.Add("                headers: { 'Content-Type': 'application/json' },") | Out-Null
        $newLines.Add('                body: JSON.stringify({') | Out-Null
        $newLines.Add('                    currentPassword: passwordForm.currentPassword,') | Out-Null
        $newLines.Add('                    newPassword: passwordForm.newPassword,') | Out-Null
        $newLines.Add('                }),') | Out-Null
        $newLines.Add('            });') | Out-Null
        $newLines.Add('            const data = await response.json();') | Out-Null
        $newLines.Add('            if (data.success) {') | Out-Null
        $newLines.Add("                setToastMessage('Password updated successfully');") | Out-Null
        $newLines.Add("                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });") | Out-Null
        $newLines.Add('            } else {') | Out-Null
        $newLines.Add("                setToastMessage(data.error || 'Failed to update password');") | Out-Null
        $newLines.Add('            }') | Out-Null
        $newLines.Add('        } catch (error) {') | Out-Null
        $newLines.Add("            setToastMessage('Failed to update password. Please try again.');") | Out-Null
        $newLines.Add('        } finally {') | Out-Null
        $newLines.Add('            setIsLoading(false);') | Out-Null
        $newLines.Add('        }') | Out-Null
        $newLines.Add('    };') | Out-Null
        continue
    }

    # Skip old function body
    if ($inPasswordFunc) {
        $braceCount += ([regex]::Matches($line, '\{').Count)
        $braceCount -= ([regex]::Matches($line, '\}').Count)
        if ($braceCount -le 0 -and $line -match '\};') {
            $inPasswordFunc = $false
        }
        continue
    }

    $newLines.Add($line) | Out-Null
}
Set-Content $file ($newLines -join "`n") -NoNewline
Write-Host "  -> Password change now calls real API" -ForegroundColor Green

# ============================================================
# FIX 3: Side Effects in ViewRenderer (CRITICAL)
# ============================================================
Write-Host "[3/15] Fixing side effects in ViewRenderer..." -ForegroundColor Yellow
$file = "src/app/ViewRenderer.tsx"
$content = Get-Content $file -Raw

# Add hooks imports
if ($content -match "import React\b") {
    $content = $content -replace "import React\b", "import React, { useState, useEffect }"
} elseif ($content -match "from 'react'") {
    $content = $content -replace "from 'react'", "{ useState, useEffect } from 'react'"
}

# Add state and effect after function declaration
$insertAfter = "ViewRendererProps) => {"
$insertCode = @"
$insertAfter
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    useEffect(() => {
        if (pendingAction === 'ai') {
            onOpenAIModal();
            onNavigate('dashboard');
            setPendingAction(null);
        }
    }, [pendingAction, onOpenAIModal, onNavigate]);
"@
$content = $content.Replace($insertAfter, $insertCode)

# Replace ai case
$content = $content -replace "case 'ai':\s*\n\s*onOpenAIModal\(\);", "case 'ai':`n      setPendingAction('ai');"
$content = $content -replace "case 'ai':\s*\n\s*onNavigate\('dashboard'\);", ""

Set-Content $file $content -NoNewline
Write-Host "  -> Side effects moved to useEffect" -ForegroundColor Green

# ============================================================
# FIX 4: Undefined extractMetadataFromDoc in Library (CRITICAL)
# ============================================================
Write-Host "[4/15] Adding extractMetadataFromDoc to Library..." -ForegroundColor Yellow
$file = "src/components/Library.tsx"
$content = Get-Content $file -Raw

$funcCode = @"

function extractMetadataFromDoc(base64String: string, fileName: string): Record<string, string> {
    const metadata: Record<string, string> = {
        fileName,
        uploadDate: new Date().toISOString(),
        fileSize: Math.round((base64String.length * 3) / 4 / 1024) + ' KB',
    };
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) metadata.fileType = ext.toUpperCase();
    return metadata;
}

"@

# Insert before the Library component definition
if ($content -notmatch "extractMetadataFromDoc") {
    $content = $content -replace "(const Library\s*[=:])", "$funcCode`$1"
}

Set-Content $file $content -NoNewline
Write-Host "  -> extractMetadataFromDoc function added" -ForegroundColor Green

# ============================================================
# FIX 5: React Error Boundary (CRITICAL)
# ============================================================
Write-Host "[5/15] Creating Error Boundary component..." -ForegroundColor Yellow

$errorBoundaryCode = @"
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                    <div className="text-red-500 text-5xl mb-4">!!</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-4 text-center max-w-md">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <details className="mb-4 text-sm text-gray-500 max-w-lg">
                        <summary className="cursor-pointer">Error details</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                            {this.state.error?.message}
                        </pre>
                    </details>
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
"@

Set-Content "src/components/ErrorBoundary.tsx" $errorBoundaryCode -NoNewline
Write-Host "  -> ErrorBoundary.tsx created" -ForegroundColor Green

# Wrap App.tsx with ErrorBoundary
Write-Host "[5b] Wrapping App with ErrorBoundary..." -ForegroundColor Yellow
$appFile = "src/App.tsx"
$appContent = Get-Content $appFile -Raw
if ($appContent -notmatch "ErrorBoundary") {
    $appContent = "import ErrorBoundary from './components/ErrorBoundary';`n" + $appContent
    $appContent = $appContent.Replace("<ViewRenderer", "<ErrorBoundary>`n          <ViewRenderer")
    $appContent = $appContent.Replace("/>", "/>`n        </ErrorBoundary>")
    Set-Content $appFile $appContent -NoNewline
}
Write-Host "  -> App wrapped with ErrorBoundary" -ForegroundColor Green

# ============================================================
# FIX 6: Shared API Config (HIGH)
# ============================================================
Write-Host "[6/15] Creating shared API config..." -ForegroundColor Yellow

$configCode = @"
export const API_URL = '/api/v1';
export const API_TIMEOUT = 30000;
export const MAX_RETRIES = 2;
"@
Set-Content "src/services/config.ts" $configCode -NoNewline

$serviceFiles = @(
    "src/services/studentService.ts",
    "src/services/courseService.ts",
    "src/services/gradeService.ts",
    "src/services/financeService.ts",
    "src/services/staffService.ts",
    "src/services/batchService.ts",
    "src/services/catalogService.ts",
    "src/services/libraryService.ts"
)

foreach ($svc in $serviceFiles) {
    if (Test-Path $svc) {
        $c = Get-Content $svc -Raw
        # Remove local API_URL declaration
        $c = $c -replace "const API_URL = '/api/v1';\r?\n", ""
        $c = $c -replace 'const API_URL = "/api/v1";\r?\n', ""
        # Add import if not present
        if ($c -notmatch "import.*API_URL.*from.*config") {
            $c = "import { API_URL } from './config';`n" + $c
        }
        Set-Content $svc $c -NoNewline
    }
}
Write-Host "  -> config.ts created, 8 services updated" -ForegroundColor Green

# ============================================================
# FIX 7: Empty Response Body Handling (HIGH)
# ============================================================
Write-Host "[7/15] Fixing empty response body handling in services..." -ForegroundColor Yellow

$parseFunc = @"

async function parseJsonSafe(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
"@

$fixServices = @(
    "src/services/courseService.ts",
    "src/services/financeService.ts",
    "src/services/staffService.ts",
    "src/services/batchService.ts",
    "src/services/catalogService.ts"
)

foreach ($svc in $fixServices) {
    if (Test-Path $svc) {
        $c = Get-Content $svc -Raw
        if ($c -notmatch "parseJsonSafe") {
            # Add after last import line
            $lastImportIndex = $c.LastIndexOf("';`n")
            if ($lastImportIndex -eq -1) { $lastImportIndex = $c.LastIndexOf("';`r`n") }
            if ($lastImportIndex -gt 0) {
                $insertPos = $c.IndexOf("`n", $lastImportIndex) + 1
                $c = $c.Substring(0, $insertPos) + $parseFunc + "`n" + $c.Substring($insertPos)
            }
        }
        # Replace response.json() with parseJsonSafe
        $c = $c -replace "await response\.json\(\)", "await parseJsonSafe(response)"
        Set-Content $svc $c -NoNewline
    }
}
Write-Host "  -> 5 services updated with parseJsonSafe" -ForegroundColor Green

# ============================================================
# FIX 8: Import Endpoint Validation (CRITICAL - Backend)
# ============================================================
Write-Host "[8/15] Adding Zod validation to import endpoint..." -ForegroundColor Yellow
$file = "backend/src/routes/import.ts"
$content = Get-Content $file -Raw

# Add zod import
if ($content -notmatch "from 'zod'") {
    $content = "import { z } from 'zod';`n" + $content
}

# Add schemas after imports
$schemaBlock = @"

const importItemSchema = z.object({
    type: z.enum(['student', 'course', 'grade', 'staff']),
    data: z.record(z.unknown()),
});

const importRequestSchema = z.object({
    items: z.array(importItemSchema).max(500, 'Maximum 500 items per import'),
});

const sanitizeImport = (v: string): string => v.replace(/["'\\]/g, '').substring(0, 100);

"@
# Find last import and add after it
$lastImport = [regex]::Match($content, "import [^;]+;").Captures
if ($lastImport.Count -gt 0) {
    $last = $lastImport[$lastImport.Count - 1]
    $insertAt = $last.Index + $last.Length
    $content = $content.Substring(0, $insertAt) + $schemaBlock + $content.Substring($insertAt)
}

# Replace unvalidated json parse with safeParse
$oldParse = "const data = await c.req.json();"
$newParse = @"
const rawBody = await c.req.json();
    const parseResult = importRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
        return c.json({ success: false, error: 'Invalid request format', details: parseResult.error.issues }, 400);
    }
    const data = parseResult.data;
"@
$content = $content.Replace($oldParse, $newParse)

# Fix error message leak
$content = $content -replace "error: error\.message", "error: 'Import processing failed'"

Set-Content $file $content -NoNewline
Write-Host "  -> Import endpoint validation added" -ForegroundColor Green

# ============================================================
# FIX 9: Missing PocketBase Collections (CRITICAL - Backend)
# ============================================================
Write-Host "[9/15] Adding missing PocketBase collections..." -ForegroundColor Yellow
$file = "backend/src/services/pocketbase.ts"
$content = Get-Content $file -Raw

$collectionsBlock = @"
        grade_appeals: {
            name: 'grade_appeals',
            type: 'base',
            fields: [
                { name: 'student_id', type: 'text', required: true },
                { name: 'student_name', type: 'text', required: true },
                { name: 'enrollment_id', type: 'text', required: true },
                { name: 'course_code', type: 'text', required: true },
                { name: 'course_name', type: 'text', required: true },
                { name: 'current_grade', type: 'text', required: true },
                { name: 'appeal_reason', type: 'text', required: true },
                { name: 'status', type: 'select', options: { values: ['Pending', 'Under Review', 'Approved', 'Denied', 'Withdrawn'] } },
                { name: 'instructor_response', type: 'text' },
                { name: 'resolution_notes', type: 'text' },
                { name: 'submitted_at', type: 'date', required: true },
                { name: 'resolved_at', type: 'date' },
            ],
        },
        grading_scales: {
            name: 'grading_scales',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'scale_data', type: 'json', required: true },
                { name: 'is_default', type: 'bool' },
                { name: 'academic_year', type: 'text' },
                { name: 'created_by', type: 'text' },
            ],
        },
"@

if ($content -notmatch "grade_appeals") {
    # Find a good insertion point - after the certificates collection
    $certMarker = "certificates:"
    $certPos = $content.IndexOf($certMarker)
    if ($certPos -gt 0) {
        # Find the end of certificates block (next },)
        $depth = 0
        $scanPos = $certPos
        for ($i = $certPos; $i -lt $content.Length; $i++) {
            if ($content[$i] -eq '{') { $depth++ }
            if ($content[$i] -eq '}') { $depth-- }
            if ($depth -le 1 -and $content[$i] -eq '}' -and $i -gt $certPos + 20) {
                # Found the closing brace of certificates
                $insertAt = $i + 1
                # Skip past comma and whitespace
                while ($insertAt -lt $content.Length -and ($content[$insertAt] -match '[,\s]')) { $insertAt++ }
                $content = $content.Substring(0, $insertAt) + "`n" + $collectionsBlock + $content.Substring($insertAt)
                break
            }
        }
    }
}

Set-Content $file $content -NoNewline
Write-Host "  -> grade_appeals and grading_scales collections added" -ForegroundColor Green

# ============================================================
# FIX 10: Admin Password Logged (CRITICAL - Backend)
# ============================================================
Write-Host "[10/15] Removing admin password from logs..." -ForegroundColor Yellow
$file = "backend/src/services/pocketbase.ts"
$content = Get-Content $file -Raw
$content = $content -replace "logger\.info\(`Password: \$\{CONFIG\.POCKETBASE_ADMIN_PASSWORD\}`\)", "logger.info('PocketBase admin credentials configured')"
$content = $content -replace "logger\.info\(.Password:.*POCKETBASE_ADMIN_PASSWORD.*\)", "logger.info('PocketBase admin credentials configured')"
Set-Content $file $content -NoNewline
Write-Host "  -> Password removed from log output" -ForegroundColor Green

# ============================================================
# FIX 11: Dockerfile Fix (CRITICAL - Backend)
# ============================================================
Write-Host "[11/15] Fixing Dockerfile with multi-stage build..." -ForegroundColor Yellow

$dockerfile = @"
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
"@
Set-Content "backend/Dockerfile" $dockerfile -NoNewline
Write-Host "  -> Multi-stage Dockerfile created" -ForegroundColor Green

# ============================================================
# FIX 12: Error Message Leaks (HIGH - Backend)
# ============================================================
Write-Host "[12/15] Sealing internal error message leaks..." -ForegroundColor Yellow

$gradesFile = "backend/src/routes/grades.ts"
$c = Get-Content $gradesFile -Raw
$c = $c -replace "error: error\.message \|\| '([^']+)'", "error: '`$1'"
Set-Content $gradesFile $c -NoNewline

$appealsFile = "backend/src/routes/grade-appeals.ts"
$c = Get-Content $appealsFile -Raw
$c = $c -replace "error: error\.message \|\| '([^']+)'", "error: '`$1'"
Set-Content $appealsFile $c -NoNewline

Write-Host "  -> Error messages no longer leak internals" -ForegroundColor Green

# ============================================================
# FIX 13: Centralize Sanitizer (MEDIUM - Backend)
# ============================================================
Write-Host "[13/15] Centralizing sanitize filter..." -ForegroundColor Yellow

$helpersFile = "backend/src/utils/helpers.ts"
$helpers = Get-Content $helpersFile -Raw
$sanitizeFunc = @"


/**
 * Sanitize a string for safe use in PocketBase filter expressions.
 * Strips quotes and backslashes, and truncates to maxLength.
 */
export function sanitizeFilter(value: string, maxLength: number = 100): string {
    return value.replace(/["'\\]/g, '').substring(0, maxLength);
}
"@
$helpers = $helpers.TrimEnd() + $sanitizeFunc
Set-Content $helpersFile $helpers -NoNewline

# Update route files to import sanitizeFilter
$routeFiles = @(
    "backend/src/routes/students.ts",
    "backend/src/routes/courses.ts",
    "backend/src/routes/staff.ts",
    "backend/src/routes/finance.ts",
    "backend/src/routes/library.ts",
    "backend/src/routes/grades.ts"
)

foreach ($rt in $routeFiles) {
    if (Test-Path $rt) {
        $c = Get-Content $rt -Raw
        # Add import if not present
        if ($c -notmatch "sanitizeFilter") {
            $c = "import { sanitizeFilter } from '../utils/helpers';`n" + $c
        }
        # Remove inline safe() declarations - match the pattern line by line
        $lines = $c -split "`n"
        $filtered = $lines | Where-Object { $_ -notmatch 'const safe = \(v: string\) => v\.replace' }
        $c = $filtered -join "`n"
        # Replace safe() calls with sanitizeFilter()
        $c = $c -replace '\bsafe\((\w+)\)', 'sanitizeFilter($1)'
        Set-Content $rt $c -NoNewline
    }
}
Write-Host "  -> sanitizeFilter centralized, 6 routes updated" -ForegroundColor Green

# ============================================================
# FIX 14: Non-atomic ID Generation (HIGH - Backend)
# ============================================================
Write-Host "[14/15] Replacing Math.random() with crypto..." -ForegroundColor Yellow

$idFiles = @(
    "backend/src/routes/students.ts",
    "backend/src/routes/staff.ts",
    "backend/src/routes/batch.ts"
)

foreach ($idf in $idFiles) {
    if (Test-Path $idf) {
        $c = Get-Content $idf -Raw
        if ($c -notmatch "from 'crypto'") {
            $c = "import { randomBytes } from 'crypto';`n" + $c
        }
        $c = $c -replace 'Math\.floor\(Math\.random\(\)\s*\*\s*9000\)\s*\+\s*1000', 'randomBytes(2).readUInt16BE(0) % 9000 + 1000'
        $c = $c -replace 'Math\.floor\(Math\.random\(\)\s*\*\s*900\)\s*\+\s*100', 'randomBytes(2).readUInt16BE(0) % 900 + 100'
        Set-Content $idf $c -NoNewline
    }
}
Write-Host "  -> crypto.randomBytes replaces Math.random in 3 files" -ForegroundColor Green

# ============================================================
# FIX 15: Change-Password Endpoint (HIGH - Backend)
# ============================================================
Write-Host "[15/15] Adding change-password endpoint..." -ForegroundColor Yellow
$file = "backend/src/routes/auth.ts"
$content = Get-Content $file -Raw

$changePwRoute = @"

// Change password endpoint
authRoutes.post('/change-password', async (c) => {
    try {
        const { currentPassword, newPassword } = await c.req.json();

        if (!currentPassword || !newPassword) {
            return c.json({ success: false, error: 'Current password and new password are required' }, 400);
        }

        if (newPassword.length < 8) {
            return c.json({ success: false, error: 'New password must be at least 8 characters' }, 400);
        }

        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const token = authHeader.substring(7);
        const { getPocketBase } = await import('../services/pocketbase');
        const pb = getPocketBase();

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = await pb.collection('users').getOne(payload.sub || payload.id);

            await pb.collection('users').authWithPassword(user.email, currentPassword);

            await pb.collection('users').update(user.id, {
                password: newPassword,
                passwordConfirm: newPassword,
            });

            return c.json({ success: true, message: 'Password updated successfully' });
        } catch {
            return c.json({ success: false, error: 'Current password is incorrect' }, 401);
        }
    } catch (error) {
        return c.json({ success: false, error: 'Failed to update password' }, 500);
    }
});

"@

if ($content -notmatch "change-password") {
    $content = $content.TrimEnd() + $changePwRoute
}

Set-Content $file $content -NoNewline
Write-Host "  -> POST /auth/change-password endpoint added" -ForegroundColor Green

# ============================================================
# DONE
# ============================================================
Write-Host ""
Write-Host "=== All 15 fixes applied! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review:     git diff" -ForegroundColor White
Write-Host "  2. Stage:      git add -A" -ForegroundColor White
Write-Host "  3. Commit:     git commit -m 'fix: critical security & architecture fixes'" -ForegroundColor White
Write-Host "  4. Push:       git push origin fix/critical-security-architecture" -ForegroundColor White
