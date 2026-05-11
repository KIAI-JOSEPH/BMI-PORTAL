try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile('/home/nissi/bmi-ums/UMS_Import_Template_BMI.xlsx');
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        data.slice(0, 10).forEach(row => console.log(JSON.stringify(row)));
    });
} catch (e) {
    console.error(e);
}
