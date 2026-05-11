/**
 * Seeds faculties, departments, programs, courses, program_courses, sample staff & library
 * when collections are empty (dev / first-run convenience).
 */
import { getPocketBase } from './pocketbase.js';
import { logger } from '../utils/logger.js';

const SAMPLE_COURSES: Array<{
  course_code: string;
  title: string;
  credits: number;
  faculty: string;
  department: string;
  level: string;
  status: string;
  description: string;
  syllabus: string;
}> = [
  { course_code: 'THEO101', title: 'Systematic Theology I', credits: 3, faculty: 'Theology', department: 'Biblical Studies', level: 'Undergraduate', status: 'Published', description: 'Introduction to core theological doctrines.', syllabus: 'God, Creation, Revelation.' },
  { course_code: 'CS101', title: 'Introduction to Web Development', credits: 4, faculty: 'ICT', department: 'Computer Science', level: 'Undergraduate', status: 'Published', description: 'Basics of HTML, CSS, and JS.', syllabus: 'Web Standards, Frontend Dev.' },
  { course_code: 'BUS201', title: 'Business Ethics', credits: 3, faculty: 'Business', department: 'Management', level: 'Undergraduate', status: 'Published', description: 'Ethical principles in modern business.', syllabus: 'Corporate Responsibility, Ethics.' },
  { course_code: 'BABS-300', title: 'BA in Biblical Studies', credits: 120, faculty: 'Theology', department: 'Biblical Studies', level: 'Undergraduate', status: 'Published', description: 'In-depth study of the Bible.', syllabus: 'OT, NT, Hermeneutics.' },
  { course_code: 'MDIV-600', title: 'Masters of Divinity', credits: 90, faculty: 'Theology', department: 'Divinity', level: 'Postgraduate', status: 'Published', description: 'Professional degree for ordained ministry.', syllabus: 'Greek/Hebrew, Preaching.' },
];

export async function seedAcademicReferenceDataIfEmpty(): Promise<void> {
  const pb = getPocketBase();
  if (!pb.authStore.isValid) {
    logger.warn('seedAcademicReferenceDataIfEmpty: not authenticated, skipping');
    return;
  }

  try {
    const facCheck = await pb.collection('faculties').getList(1, 1);
    if (facCheck.totalItems > 0) {
      logger.info('Academic reference data already present, skipping seed');
      return;
    }

    logger.info('Seeding academic reference data (empty catalog)...');

    const fTheo = await pb.collection('faculties').create({ faculty_code: 'THEO', name: 'School of Theology' });
    const fIct = await pb.collection('faculties').create({ faculty_code: 'ICT', name: 'School of ICT' });
    const fBus = await pb.collection('faculties').create({ faculty_code: 'BUS', name: 'School of Business' });

    const dBs = await pb.collection('departments').create({ dept_code: 'BS', name: 'Biblical Studies', faculty_code: fTheo.id });
    await pb.collection('departments').create({ dept_code: 'CS', name: 'Computer Science', faculty_code: fIct.id });
    await pb.collection('departments').create({ dept_code: 'MGT', name: 'Management', faculty_code: fBus.id });
    const dDiv = await pb.collection('departments').create({ dept_code: 'DIV', name: 'Divinity', faculty_code: fTheo.id });

    const pUg = await pb.collection('programs').create({
      program_code: 'BABS',
      name: 'BA Biblical Studies',
      degree_level: 'Undergraduate',
      total_credits: 120,
      dept_code: dBs.id,
    });
    const pGrad = await pb.collection('programs').create({
      program_code: 'MDIV',
      name: 'Master of Divinity',
      degree_level: 'Postgraduate',
      total_credits: 90,
      dept_code: dDiv.id,
    });

    const courseIdByCode = new Map<string, string>();
    for (const c of SAMPLE_COURSES) {
      const row = await pb.collection('courses').create({
        course_code: c.course_code,
        title: c.title,
        credits: c.credits,
        is_elective: false,
        faculty: c.faculty,
        department: c.department,
        level: c.level,
        status: c.status,
        description: c.description,
        syllabus: c.syllabus,
      });
      courseIdByCode.set(c.course_code, row.id);
    }

    const link = async (programId: string, courseCode: string, required: boolean, order: number) => {
      const cid = courseIdByCode.get(courseCode);
      if (!cid) return;
      await pb.collection('program_courses').create({
        program_code: programId,
        course_code: cid,
        is_required: required,
        sequence_order: order,
      });
    };

    await link(pUg.id, 'THEO101', true, 1);
    await link(pUg.id, 'CS101', false, 2);
    await link(pUg.id, 'BABS-300', true, 3);
    await link(pGrad.id, 'THEO101', true, 1);
    await link(pGrad.id, 'MDIV-600', true, 2);

    await pb.collection('staff').create({
      staff_number: 'STF-SEED-001',
      first_name: 'Samuel',
      last_name: 'Kiptoo',
      email: 's.kiptoo@bmi.edu',
      phone: '+254711000001',
      title: 'Dean',
      role: 'Dean',
      dept_code: dBs.id,
      department: 'Biblical Studies',
      category: 'Academic',
      specialization: 'Systematic Theology',
      office: 'Zion Wing 101',
      office_hours: 'Mon-Wed 10-12',
      status: 'Full-time',
      join_date: '2015-08-01',
      avatar_color: 'bg-purple-700',
    });

    await pb.collection('library_items').create({
      title: 'Systematic Theology',
      author: 'Wayne Grudem',
      category: 'Theology',
      type: 'Hardcopy',
      status: 'Available',
      year: '1994',
      description: 'Comprehensive introduction to biblical doctrine.',
      downloadUrl: '',
    });

    logger.info('Academic reference seed complete');
  } catch (e) {
    logger.warn('Academic seed failed (non-fatal):', e);
  }
}
