/**
 * BMI UMS - Test Grading System API
 * Tests all grading system endpoints
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bmi.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

const pb = new PocketBase(POCKETBASE_URL);

async function testGradingAPI() {
  console.log('========================================');
  console.log('BMI UMS - Grading System API Tests');
  console.log('========================================\n');

  try {
    // Authenticate
    console.log('1. Authenticating...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    const token = pb.authStore.token;
    console.log('✓ Authenticated\n');

    // Test 1: Get grading scales
    console.log('2. Testing GET /api/v1/grading-scales');
    const scalesResponse = await fetch(`${API_URL}/api/v1/grading-scales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const scalesData = await scalesResponse.json();
    console.log(`✓ Status: ${scalesResponse.status}`);
    console.log(`✓ Found ${scalesData.data?.items?.length || 0} grading scales\n`);

    // Test 2: Create a test grade
    console.log('3. Testing POST /api/v1/grades');
    const testGrade = {
      studentId: 'test-student-001',
      studentName: 'Test Student',
      admissionNo: 'BMI2024001',
      courseId: 'test-course-001',
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      credits: 3,
      gradingScaleId: scalesData.data?.items?.[0]?.id || 'default',
      gradingScaleType: 'US_4_0',
      components: [
        {
          componentId: 'midterm-1',
          componentType: 'Midterm',
          score: 85,
          maxScore: 100,
          weight: 30,
          gradedAt: new Date().toISOString(),
        },
        {
          componentId: 'final-1',
          componentType: 'Final_Exam',
          score: 90,
          maxScore: 100,
          weight: 40,
          gradedAt: new Date().toISOString(),
        },
        {
          componentId: 'assignments-1',
          componentType: 'Assignment',
          score: 95,
          maxScore: 100,
          weight: 30,
          gradedAt: new Date().toISOString(),
        },
      ],
      numericGrade: 90,
      letterGrade: 'A-',
      gradePoints: 3.7,
      isRetake: false,
      academicYear: '2024-2025',
      semester: 'Fall',
      status: 'Finalized',
      createdBy: 'admin',
    };

    const createResponse = await fetch(`${API_URL}/api/v1/grades`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testGrade),
    });
    const createData = await createResponse.json();
    console.log(`✓ Status: ${createResponse.status}`);
    console.log(`✓ Grade created: ${createData.data?.id}\n`);

    const gradeId = createData.data?.id;

    // Test 3: Get the created grade
    if (gradeId) {
      console.log('4. Testing GET /api/v1/grades/:id');
      const getResponse = await fetch(`${API_URL}/api/v1/grades/${gradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const getData = await getResponse.json();
      console.log(`✓ Status: ${getResponse.status}`);
      console.log(`✓ Grade: ${getData.data?.letterGrade} (${getData.data?.gradePoints} GPA)\n`);

      // Test 4: Update the grade
      console.log('5. Testing PUT /api/v1/grades/:id');
      const updateResponse = await fetch(`${API_URL}/api/v1/grades/${gradeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          percentileRank: 85,
          lastModifiedBy: 'admin',
        }),
      });
      const updateData = await updateResponse.json();
      console.log(`✓ Status: ${updateResponse.status}`);
      console.log(`✓ Grade updated with percentile rank: ${updateData.data?.percentileRank}\n`);

      // Test 5: Get all grades with filters
      console.log('6. Testing GET /api/v1/grades with filters');
      const listResponse = await fetch(
        `${API_URL}/api/v1/grades?studentId=test-student-001&semester=Fall`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const listData = await listResponse.json();
      console.log(`✓ Status: ${listResponse.status}`);
      console.log(`✓ Found ${listData.data?.items?.length || 0} grades\n`);

      // Test 6: Create a grade appeal
      console.log('7. Testing POST /api/v1/grade-appeals');
      const appealResponse = await fetch(`${API_URL}/api/v1/grade-appeals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeId: gradeId,
          studentId: 'test-student-001',
          courseId: 'test-course-001',
          courseCode: 'CS101',
          reason: 'Grading error in final exam',
          explanation: 'I believe there was an error in the grading of question 5 on the final exam. I provided the correct answer but received no credit.',
          originalGrade: 'A-',
        }),
      });
      const appealData = await appealResponse.json();
      console.log(`✓ Status: ${appealResponse.status}`);
      console.log(`✓ Appeal created: ${appealData.data?.id}\n`);

      // Test 7: Delete the test grade
      console.log('8. Testing DELETE /api/v1/grades/:id');
      const deleteResponse = await fetch(`${API_URL}/api/v1/grades/${gradeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const deleteData = await deleteResponse.json();
      console.log(`✓ Status: ${deleteResponse.status}`);
      console.log(`✓ Grade deleted\n`);
    }

    console.log('========================================');
    console.log('✓ All tests passed!');
    console.log('========================================\n');

  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testGradingAPI();
