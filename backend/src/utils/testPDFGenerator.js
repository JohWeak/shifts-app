// backend/src/utils/testPDFGenerator.js
const PDFGenerator = require('./pdfGenerator');
const fs = require('fs');
const path = require('path');

// Test data for PDF generation
const testData = {
    schedule: {
        id: 1,
        week: '2025-06-09 to 2025-06-15',
        site: 'Test Office Building',
        status: 'published',
        created: new Date()
    },
    assignments: [
        {
            date: '2025-06-09',
            employee: 'John Doe',
            shift: 'Morning',
            shift_time: '06:00',
            position: 'Security Guard',
            status: 'assigned'
        },
        {
            date: '2025-06-09',
            employee: 'Jane Smith',
            shift: 'Evening',
            shift_time: '14:00',
            position: 'Receptionist',
            status: 'assigned'
        },
        {
            date: '2025-06-10',
            employee: 'Bob Johnson',
            shift: 'Night',
            shift_time: '22:00',
            position: 'Security Guard',
            status: 'assigned'
        },
        {
            date: '2025-06-11',
            employee: 'Alice Brown',
            shift: 'Morning',
            shift_time: '06:00',
            position: 'Security Guard',
            status: 'assigned'
        },
        {
            date: '2025-06-11',
            employee: 'Charlie Wilson',
            shift: 'Afternoon',
            shift_time: '14:00',
            position: 'Maintenance',
            status: 'assigned'
        }
    ]
};

// Test function
async function testPDFGeneration() {
    try {
        console.log('🚀 Testing PDF generation...');

        // Test English version
        console.log('📄 Generating English PDF...');
        const pdfGeneratorEn = new PDFGenerator('en');
        const pdfBufferEn = await pdfGeneratorEn.generateSchedulePDF(testData);

        // Save English test PDF
        const outputPathEn = path.join(__dirname, '../test_schedule_en.pdf');
        fs.writeFileSync(outputPathEn, pdfBufferEn);
        console.log(`✅ English PDF generated: ${outputPathEn}`);
        console.log(`📊 PDF size: ${Math.round(pdfBufferEn.length / 1024)} KB`);

        // Test Russian version
        console.log('📄 Generating Russian PDF...');
        const pdfGeneratorRu = new PDFGenerator('ru');
        const pdfBufferRu = await pdfGeneratorRu.generateSchedulePDF(testData);

        // Save Russian test PDF
        const outputPathRu = path.join(__dirname, '../test_schedule_ru.pdf');
        fs.writeFileSync(outputPathRu, pdfBufferRu);
        console.log(`✅ Russian PDF generated: ${outputPathRu}`);
        console.log(`📊 PDF size: ${Math.round(pdfBufferRu.length / 1024)} KB`);

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        process.exit(1);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testPDFGeneration();
}

module.exports = { testPDFGeneration };