const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-campus-nexus',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Campus NEXUS V2 Firestore Rules', () => {

  const setupUsers = async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('admin_user').set({ role: 'admin' });
      await db.collection('users').doc('faculty_user').set({ role: 'faculty' });
      await db.collection('users').doc('student_user').set({ role: 'student' });
    });
  };

  describe('Global Collections (Buildings, Rooms)', () => {
    it('should deny unauthenticated users from reading buildings', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection('buildings').get());
    });

    it('should allow authenticated users to read buildings', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertSucceeds(studentDb.collection('buildings').get());
    });

    it('should deny non-admins from writing buildings', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertFails(studentDb.collection('buildings').doc('new_bldg').set({ name: 'Test' }));
    });

    it('should allow admins to write buildings', async () => {
      await setupUsers();
      const adminDb = testEnv.authenticatedContext('admin_user').firestore();
      await assertSucceeds(adminDb.collection('buildings').doc('new_bldg').set({ name: 'Test' }));
    });
  });

  describe('Role-specific Data (Students, Faculty)', () => {
    it('should allow students to read their own profile', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertSucceeds(studentDb.collection('students').doc('student_user').get());
    });

    it('should deny students from reading other student profiles', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertFails(studentDb.collection('students').doc('other_student').get());
    });

    it('should allow faculty to read any student profile', async () => {
      await setupUsers();
      const facultyDb = testEnv.authenticatedContext('faculty_user').firestore();
      await assertSucceeds(facultyDb.collection('students').doc('student_user').get());
    });
  });

  describe('Campus Pulse & Crowd', () => {
    it('should allow anyone authenticated to submit a crowd report', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertSucceeds(studentDb.collection('crowd_reports').add({ level: 'high' }));
    });

    it('should deny students from updating pulse locations directly', async () => {
      await setupUsers();
      const studentDb = testEnv.authenticatedContext('student_user').firestore();
      await assertFails(studentDb.collection('pulse_locations').doc('loc1').set({ density: 'high' }));
    });
  });
});
