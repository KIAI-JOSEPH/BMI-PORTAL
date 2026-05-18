#!/usr/bin/env tsx
/**
 * BMI UMS — Nuke & Seed
 * Wipes all records from core collections then re-seeds with real data.
 * Run: npx tsx backend/scripts/nuke-and-seed.ts
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const PB_URL   = process.env.POCKETBASE_URL            ?? 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL    ?? 'admin@bmi.edu';
const PB_PASS  = process.env.POCKETBASE_ADMIN_PASSWORD ?? (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

const COLORS = ['bg-purple-600','bg-blue-600','bg-green-600','bg-red-600',
                'bg-orange-600','bg-teal-600','bg-indigo-600','bg-pink-600'];
let _ci = 0;
const nextColor = () => COLORS[_ci++ % COLORS.length];

function gradeFromScore(s: number): { grade: string; grade_point: number; remarks: string } {
  if (s >= 80) return { grade: 'A',  grade_point: 4.0, remarks: 'Pass' };
  if (s >= 75) return { grade: 'B+', grade_point: 3.5, remarks: 'Pass' };
  if (s >= 70) return { grade: 'B',  grade_point: 3.0, remarks: 'Pass' };
  if (s >= 65) return { grade: 'C+', grade_point: 2.5, remarks: 'Pass' };
  if (s >= 60) return { grade: 'C',  grade_point: 2.0, remarks: 'Pass' };
  if (s >= 50) return { grade: 'D',  grade_point: 1.0, remarks: 'Pass' };
  return         { grade: 'F',  grade_point: 0.0, remarks: 'Fail' };
}

// ─── Reference data ────────────────────────────────────────────────────────────
const CAMPUSES = [
  { slug: 'mukurweini', name: 'Mukurweini',   location: 'Mukurweini, Nyeri County' },
  { slug: 'karatina1',  name: 'Karatina A',   location: 'Karatina, Nyeri County'   },
  { slug: 'karatina2',  name: 'Karatina B',   location: 'Karatina, Nyeri County'   },
  { slug: 'othaya',     name: 'Othaya',        location: 'Othaya, Nyeri County'     },
  { slug: 'nyeri',      name: 'Nyeri',         location: 'Nyeri Town, Nyeri County' },
  { slug: 'kiambu',     name: 'Kiambu',        location: 'Kiambu Town, Kiambu County' },
];

const MODULES = [
  { slug: 'm1', name: 'Module 1', semester: 'Semester 1', sort_order: 1 },
  { slug: 'm2', name: 'Module 2', semester: 'Semester 2', sort_order: 2 },
  { slug: 'm3', name: 'Module 3', semester: 'Semester 1', sort_order: 3 },
  { slug: 'm4', name: 'Module 4', semester: 'Semester 2', sort_order: 4 },
  { slug: 'm5', name: 'Module 5', semester: 'Semester 1', sort_order: 5 },
];

const COURSES_RAW = [
  { slug:'eng101',  code:'ENG 101', title:'Basic English Grammar',              credit_hours:2, category:'General Education',       module_slug:'m1' },
  { slug:'awr102',  code:'AWR 102', title:'Academic Writing',                   credit_hours:2, category:'General Education',       module_slug:'m1' },
  { slug:'ots111',  code:'OTS 111', title:'Old Testament Survey',               credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'nts112',  code:'NTS 112', title:'New Testament Survey',               credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'bib113',  code:'BIB 113', title:'Bibliology',                         credit_hours:3, category:'Theology',                module_slug:'m1' },
  { slug:'her114',  code:'HER 114', title:'Biblical Hermeneutics',              credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'eva115',  code:'EVA 115', title:'Evangelism',                         credit_hours:2, category:'Ministry',                module_slug:'m1' },
  { slug:'cfm116',  code:'CFM 116', title:'Christian Family',                   credit_hours:2, category:'Ministry',                module_slug:'m1' },
  { slug:'hom121',  code:'HOM 121', title:'Homiletics',                         credit_hours:3, category:'Ministry',                module_slug:'m2' },
  { slug:'chh122',  code:'CHH 122', title:'Church History',                     credit_hours:3, category:'Church History',          module_slug:'m2' },
  { slug:'thp123',  code:'THP 123', title:'Theology Proper',                    credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'chr124',  code:'CHR 124', title:'Christology',                        credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'sot125',  code:'SOT 125', title:'Soteriology',                        credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'pne126',  code:'PNE 126', title:'Pneumatology',                       credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'prw127',  code:'PRW 127', title:'Praise and Worship',                 credit_hours:2, category:'Ministry',                module_slug:'m2' },
  { slug:'ecc211',  code:'ECC 211', title:'Ecclesiology',                       credit_hours:3, category:'Theology',                module_slug:'m3' },
  { slug:'cad212',  code:'CAD 212', title:'Church Administration',              credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'chg213',  code:'CHG 213', title:'Church Growth',                      credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'chp214',  code:'CHP 214', title:'Church Planting',                    credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'fsm215',  code:'FSM 215', title:'Foundation of Successful Ministry',  credit_hours:2, category:'Ministry',                module_slug:'m3' },
  { slug:'spf216',  code:'SPF 216', title:'Spiritual Formation',                credit_hours:3, category:'Spiritual Development',   module_slug:'m3' },
  { slug:'pos217',  code:'POS 217', title:'Principles of Success',              credit_hours:2, category:'Leadership Development',  module_slug:'m3' },
  { slug:'ukp218',  code:'UKP 218', title:"Understanding God's Kingdom Principles", credit_hours:3, category:'Theology',           module_slug:'m3' },
  { slug:'esc221',  code:'ESC 221', title:'Eschatology',                        credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'ang222',  code:'ANG 222', title:'Angelology',                         credit_hours:2, category:'Theology',                module_slug:'m4' },
  { slug:'anh223',  code:'ANH 223', title:'Anthropology & Hamartiology',        credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'spw224',  code:'SPW 224', title:'Spiritual Warfare',                  credit_hours:3, category:'Spiritual Development',   module_slug:'m4' },
  { slug:'spr225',  code:'SPR 225', title:'Spiritual Realm',                    credit_hours:2, category:'Spiritual Development',   module_slug:'m4' },
  { slug:'apo226',  code:'APO 226', title:'Christian Apologetics',              credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'pce227',  code:'PCE 227', title:'Pastoral Counselling & Ethics',      credit_hours:3, category:'Ministry',                module_slug:'m4' },
  { slug:'mwr228',  code:'MWR 228', title:'Major World Religions',              credit_hours:3, category:'Comparative Religion',    module_slug:'m4' },
  { slug:'grk311',  code:'GRK 311', title:'Biblical Greek',                     credit_hours:3, category:'Biblical Languages',      module_slug:'m5' },
  { slug:'heb312',  code:'HEB 312', title:'Biblical Hebrew',                    credit_hours:3, category:'Biblical Languages',      module_slug:'m5' },
  { slug:'min315',  code:'MIN 315', title:'Ministry Practicum / Internship',    credit_hours:4, category:'Practicum',               module_slug:'m5' },
  { slug:'res316',  code:'RES 316', title:'Research Project',                   credit_hours:3, category:'Research',                module_slug:'m5' },
];

// Inline the full student dataset from seed-real-data.ts
// (abbreviated here - pulls from the canonical file)
import { STUDENTS } from './seed-real-data-students.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function wipeFast(token: string, collection: string) {
  process.stdout.write(`   Wiping ${collection}... `);
  let total = 0;
  while (true) {
    const r = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=200&skipTotal=1`, {
      headers: { Authorization: token }
    });
    const d = await r.json() as any;
    if (!d.items || d.items.length === 0) break;
    // Delete in parallel batches of 10
    const chunks = [];
    for (let i = 0; i < d.items.length; i += 10) chunks.push(d.items.slice(i, i + 10));
    for (const chunk of chunks) {
      await Promise.all(chunk.map((item: any) =>
        fetch(`${PB_URL}/api/collections/${collection}/records/${item.id}`, {
          method: 'DELETE', headers: { Authorization: token }
        })
      ));
      total += chunk.length;
    }
    if (d.items.length < 200) break;
  }
  console.log(`${total} deleted`);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BMI UMS — Nuke & Seed                                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Authenticate
  console.log('🔐  Authenticating...');
  const authResp = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS })
  });
  if (!authResp.ok) { console.error('Auth failed:', await authResp.text()); process.exit(1); }
  const auth: any = await authResp.json();
  const token = auth.token;
  console.log('✅  Authenticated\n');

  // ── WIPE ──────────────────────────────────────────────────────────────────
  console.log('🗑️  Wiping all data...');
  await wipeFast(token, 'academic_records');
  await wipeFast(token, 'students');
  await wipeFast(token, 'courses');
  await wipeFast(token, 'modules');
  await wipeFast(token, 'campuses');
  console.log('✅  All collections wiped\n');

  // Use the PocketBase instance for creates (faster SDK path)
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  pb.authStore.save(token, auth.admin);

  // ── SEED ──────────────────────────────────────────────────────────────────

  // 1. Campuses
  console.log('📍  Seeding campuses...');
  const campusIdMap = new Map<string, string>();
  for (const c of CAMPUSES) {
    const rec = await pb.collection('campuses').create({ name: c.name, location: c.location });
    campusIdMap.set(c.slug, rec.id);
  }
  console.log(`   ✅  ${CAMPUSES.length} campuses`);

  // 2. Modules
  console.log('📚  Seeding modules...');
  const moduleIdMap = new Map<string, string>();
  for (const m of MODULES) {
    const rec = await pb.collection('modules').create({ name: m.name, semester: m.semester, sort_order: m.sort_order });
    moduleIdMap.set(m.slug, rec.id);
  }
  console.log(`   ✅  ${MODULES.length} modules`);

  // 3. Courses
  console.log('📖  Seeding courses...');
  const courseIdMap = new Map<string, string>();
  for (const c of COURSES_RAW) {
    const rec = await pb.collection('courses').create({
      code: c.code, title: c.title, credit_hours: c.credit_hours,
      category: c.category, module_id: moduleIdMap.get(c.module_slug) ?? null,
      course_code: c.code, credits: c.credit_hours, name: c.title,
      level: 'Diploma', status: 'Published', description: c.title, syllabus: c.category,
    });
    courseIdMap.set(c.slug, rec.id);
  }
  console.log(`   ✅  ${COURSES_RAW.length} courses`);

  // 4. Students
  console.log(`👩‍🎓  Seeding ${STUDENTS.length} students...`);
  const studentIdMap = new Map<string, string>();
  for (const s of STUDENTS) {
    const cid = campusIdMap.get(s.campus_slug) ?? null;
    const nameParts = s.full_name.split(' ');
    const first_name = nameParts[0] ?? '';
    const last_name = nameParts.slice(1).join(' ');
    try {
      const rec = await pb.collection('students').create({
        student_code: s.student_code, reg_no: s.reg_no, full_name: s.full_name,
        first_name, last_name, gender: s.gender, nationality: s.nationality,
        phone: s.phone, email: s.email, admission_no: s.admission_no,
        admission_date: '2025-01-01', programme: 'Diploma in Theology & Christian Ministry',
        status: 'Active', campus_id: cid, avatar_color: nextColor(),
        student_number: s.student_code, faculty: 'Theology',
        department: 'Theology & Ministry', yearOfStudy: 1, academicLevel: 'Diploma',
      });
      studentIdMap.set(s.student_code, rec.id);
    } catch (e: any) {
      console.warn(`   ⚠  ${s.full_name}: ${e.message}`);
    }
  }
  console.log(`   ✅  ${studentIdMap.size} students`);

  // 5. Academic records (parallel batches)
  console.log('📊  Seeding academic records...');
  let created = 0;
  const allRecords: any[] = [];
  for (const s of STUDENTS) {
    const sid = studentIdMap.get(s.student_code);
    if (!sid) continue;
    for (const g of s.grades) {
      const cid = courseIdMap.get(g.course_slug);
      if (!cid) continue;
      const { grade, grade_point, remarks } = gradeFromScore(g.total_score);
      const courseObj = COURSES_RAW.find(c => c.slug === g.course_slug)!;
      const moduleObj = MODULES.find(m => m.slug === courseObj.module_slug)!;
      allRecords.push({
        student_id: sid, course_id: cid, total_score: g.total_score,
        ca_score: null, exam_score: null, grade, grade_point, remarks,
        academic_year: '2025', semester: moduleObj.semester,
      });
    }
  }

  // Insert in parallel chunks of 20
  for (let i = 0; i < allRecords.length; i += 20) {
    const chunk = allRecords.slice(i, i + 20);
    await Promise.all(chunk.map(r => pb.collection('academic_records').create(r)));
    created += chunk.length;
    process.stdout.write(`\r   ${created}/${allRecords.length} records...`);
  }
  console.log(`\n   ✅  ${created} records`);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   ✅  Nuke & Seed Complete!                              ║');
  console.log(`║   Campuses: ${CAMPUSES.length}  Modules: ${MODULES.length}  Courses: ${COURSES_RAW.length}  Students: ${studentIdMap.size}  Records: ${created}`.padEnd(57) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
