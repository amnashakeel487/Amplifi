import assert from 'assert';
import { mockDb } from '../src/lib/mock-db';
import { canTransition, getAvailableTransitions, WORKFLOW_STATUS_META } from '../src/lib/workflow-engine';
import { googleDriveService } from '../src/lib/google-drive';
import { Post, UserProfile, Project, PostWorkflowStatus } from '../src/lib/types';

async function runRealWorkflowVerification() {
  console.log('================================================================');
  console.log('  AMPLIFI REAL WORKFLOW VERIFICATION SUITE (SOURCE OF TRUTH)');
  console.log('================================================================\n');

  // ----------------------------------------------------
  // REQUIREMENT 0: Clean Install - Zero Fake Data Verification
  // ----------------------------------------------------
  console.log('PHASE 0: Verifying Zero Fake Data on Fresh Install...');
  mockDb.resetToClean();
  
  const initialUsers = mockDb.getUsers();
  const initialProjects = mockDb.getProjects();
  const initialPosts = mockDb.getPosts();
  const initialClients = mockDb.getClients();
  const initialLogs = mockDb.getAuditLogs();

  assert.strictEqual(initialUsers.length, 1, 'Only admin account should exist on fresh install');
  assert.strictEqual(initialUsers[0].email, 'admin@amplifi.io', 'Bootstrap account must be admin@amplifi.io');
  assert.strictEqual(initialProjects.length, 0, 'Must have zero fake projects');
  assert.strictEqual(initialPosts.length, 0, 'Must have zero fake posts');
  assert.strictEqual(initialClients.length, 0, 'Must have zero fake clients');
  assert.strictEqual(initialLogs.length, 0, 'Must have zero fake audit logs');
  console.log('  ✓ Clean state confirmed: 0 projects, 0 posts, 0 clients, 0 fake logs.');
  console.log('  ✓ Only bootstrap admin (admin@amplifi.io) exists.\n');

  // ----------------------------------------------------
  // REQUIREMENT 1: Admin Creates Project with 1 Manager & Multiple Students
  // ----------------------------------------------------
  console.log('PHASE 1: Admin Creates Users & Initiates Campaign Project...');
  const manager = mockDb.createUser({
    email: 'marcus.manager@agency.com',
    full_name: 'Marcus Vance',
    role: 'manager',
    status: 'active',
  });

  const studentA = mockDb.createUser({
    email: 'sara.student@university.edu',
    google_email: 'sara.creator@gmail.com',
    full_name: 'Sara Chen',
    role: 'student',
    status: 'active',
  });

  const studentB = mockDb.createUser({
    email: 'leo.student@university.edu',
    google_email: 'leo.creator@gmail.com',
    full_name: 'Leo Morales',
    role: 'student',
    status: 'active',
  });

  // Admin creates project with brief, manager, and students (NO single project drive folder)
  const project = mockDb.createProject({
    title: 'Spring Brand Re-launch 2026',
    description: 'Focus on authentic student storytelling and high-energy shorts. Deliverables require 4K video or high-res graphics.',
    status: 'active',
    priority: 'high',
    assigned_manager_id: manager.id,
    assigned_student_ids: [studentA.id, studentB.id],
    deadline: '2026-11-30T23:59:59Z',
  });

  assert.strictEqual(project.assigned_manager_id, manager.id);
  assert.deepStrictEqual(project.assigned_student_ids, [studentA.id, studentB.id]);
  assert.strictEqual(project.drive_folder_id, undefined, 'Project level drive binding must be removed');
  console.log('  ✓ Project created with assigned Manager and 2 Students.');
  console.log('  ✓ Single Drive Asset Binding successfully removed from project model.\n');

  // ----------------------------------------------------
  // REQUIREMENT 2: Admin Sets Separate Video and Image Folders per Student
  // ----------------------------------------------------
  console.log('PHASE 2: Admin Configures & Verifies Student Drive Folders...');
  
  // Set Sara's video folder
  const saraVideoFolder = mockDb.setStudentFolder({
    project_id: project.id,
    student_id: studentA.id,
    media_type: 'video',
    drive_folder_id: '1_SARA_VIDEOS_DRIVE_FOLDER_ID',
    drive_folder_url: 'https://drive.google.com/drive/folders/1_SARA_VIDEOS_DRIVE_FOLDER_ID',
    permission_verified: true,
    verification_status: 'verified',
  });

  // Check that Video and Image folders must be different
  let duplicateFolderRejected = false;
  try {
    // Attempting to set Sara's image folder to the SAME drive ID as her video folder
    mockDb.setStudentFolder({
      project_id: project.id,
      student_id: studentA.id,
      media_type: 'image',
      drive_folder_id: '1_SARA_VIDEOS_DRIVE_FOLDER_ID',
      drive_folder_url: 'https://drive.google.com/drive/folders/1_SARA_VIDEOS_DRIVE_FOLDER_ID',
    });
  } catch (err: any) {
    if (err.message.includes('must be different')) {
      duplicateFolderRejected = true;
    }
  }
  assert.strictEqual(duplicateFolderRejected, true, 'Video and Image folders must be different; duplicate assignment must throw error');
  console.log('  ✓ Duplicate folder rejection verified: Video and Image folders must be different.');

  // Now set Sara's separate image folder
  const saraImageFolder = mockDb.setStudentFolder({
    project_id: project.id,
    student_id: studentA.id,
    media_type: 'image',
    drive_folder_id: '1_SARA_IMAGES_DRIVE_FOLDER_ID',
    drive_folder_url: 'https://drive.google.com/drive/folders/1_SARA_IMAGES_DRIVE_FOLDER_ID',
    permission_verified: true,
    verification_status: 'verified',
  });

  // Set Leo's folders
  mockDb.setStudentFolder({
    project_id: project.id,
    student_id: studentB.id,
    media_type: 'video',
    drive_folder_id: '2_LEO_VIDEOS_DRIVE_FOLDER_ID',
    drive_folder_url: 'https://drive.google.com/drive/folders/2_LEO_VIDEOS_DRIVE_FOLDER_ID',
    permission_verified: true,
    verification_status: 'verified',
  });

  mockDb.setStudentFolder({
    project_id: project.id,
    student_id: studentB.id,
    media_type: 'image',
    drive_folder_id: '2_LEO_IMAGES_DRIVE_FOLDER_ID',
    drive_folder_url: 'https://drive.google.com/drive/folders/2_LEO_IMAGES_DRIVE_FOLDER_ID',
    permission_verified: true,
    verification_status: 'verified',
  });

  const studentAFolders = mockDb.getStudentFolders(project.id, studentA.id);
  assert.strictEqual(studentAFolders.length, 2);
  assert.strictEqual(studentAFolders.find(f => f.media_type === 'video')?.drive_folder_id, '1_SARA_VIDEOS_DRIVE_FOLDER_ID');
  assert.strictEqual(studentAFolders.find(f => f.media_type === 'image')?.drive_folder_id, '1_SARA_IMAGES_DRIVE_FOLDER_ID');
  console.log('  ✓ Separate VIDEO and IMAGE folders assigned per student.');
  console.log('  ✓ Rule verified: Video folder != Image folder.');

  // Test Student Folder Isolation: Leo cannot see Sara\'s folders
  const studentBFolders = mockDb.getStudentFolders(project.id, studentB.id);
  assert(!studentBFolders.some(f => f.drive_folder_id.includes('SARA')), 'Leo must not see Sara\'s folders');
  console.log('  ✓ Student folder isolation verified (students cannot access each others folders).\n');

  // Test Media Type Enforcement
  console.log('PHASE 2b: Enforcing Correct Media Type for Folder...');
  const imageInVideoValidation = googleDriveService.validateDeliverableMedia({
    fileUrl: 'https://drive.google.com/file/d/sample-file/view',
    fileName: 'student_photo.jpg',
    fileMimeType: 'image/jpeg',
    expectedMediaType: 'video',
  });
  assert.strictEqual(imageInVideoValidation.valid, false, 'Uploading image to video folder must be rejected');
  assert(imageInVideoValidation.error?.includes('image'), 'Error message must specify expected video');
  console.log('  ✓ Media type enforcement verified: Image rejected in VIDEO folder.');

  const videoInVideoValidation = googleDriveService.validateDeliverableMedia({
    fileUrl: 'https://drive.google.com/file/d/sample-video/view',
    fileName: 'student_vlog.mp4',
    fileMimeType: 'video/mp4',
    expectedMediaType: 'video',
  });
  assert.strictEqual(videoInVideoValidation.valid, true, 'MP4 video in video folder must pass');
  console.log('  ✓ Video accepted in VIDEO folder.\n');

  // ----------------------------------------------------
  // REQUIREMENT 3: Manager Views Brief & Creates/Assigns Topic-Wise Post
  // ----------------------------------------------------
  console.log('PHASE 3: Manager View & Topic-Wise Post Creation...');
  // Manager fetches their projects
  const managerProjects = mockDb.getProjectsForUser(manager.id, 'manager');
  assert.strictEqual(managerProjects.length, 1);
  assert.strictEqual(managerProjects[0].description, project.description);
  console.log('  ✓ Manager views assigned project with Admin brief: "' + managerProjects[0].description + '"');

  // Manager creates a topic-wise video post and assigns to Sara Chen
  const managerCreatedPost = mockDb.createPost({
    project_id: project.id,
    title: 'Day in the Life: Student Creator Routine',
    assigned_creator_id: studentA.id,
    content_type: 'video',
    target_folder_id: saraVideoFolder.drive_folder_id,
    platform: 'instagram',
    status: 'assigned',
    origin: 'manager_created',
    scheduled_date: '2026-11-15T18:00:00Z',
    content: '<p>Include B-roll of morning study session and library work.</p>',
  });

  assert.strictEqual(managerCreatedPost.origin, 'manager_created');
  assert.strictEqual(managerCreatedPost.content_type, 'video');
  assert.strictEqual(managerCreatedPost.assigned_creator_id, studentA.id);
  assert.strictEqual(managerCreatedPost.status, 'assigned');
  console.log('  ✓ Manager created topic-wise post and assigned to Sara.\n');

  // ----------------------------------------------------
  // REQUIREMENT 4: Student Work & Rich Text ChatGPT Formatting
  // ----------------------------------------------------
  console.log('PHASE 4: Student Submission with Rich ChatGPT Formatting & Drive Video...');
  // Sara sees her assigned post
  const saraPosts = mockDb.getPostsForUser(studentA.id, 'student');
  assert.strictEqual(saraPosts.length, 1);
  assert.strictEqual(saraPosts[0].id, managerCreatedPost.id);

  // Student writes rich ChatGPT-formatted copy
  const chatGPTFormattedCopy = `
    <h2>🚀 5 Morning Habits of a Top CS Student</h2>
    <p>Success isn't about luck—it's about <strong>repeatable daily systems</strong>. Here is my exact morning breakdown:</p>
    <ul>
      <li><strong>06:30 AM</strong>: Hydrate & 15 mins cold walk ☀️</li>
      <li><strong>07:00 AM</strong>: Deep work block (Zero phone notifications) 💻</li>
      <li><strong>09:00 AM</strong>: Algorithmic problem breakdown & notes 📝</li>
    </ul>
    <blockquote>"Small disciplines repeated with consistency every day lead to great achievements."</blockquote>
    <p>Double tap if you're grinding today! 🔥 #StudyRoutine #StudentLife #Productivity</p>
  `.trim();

  // Student submits post with formatted copy and video drive file
  const submittedPost = mockDb.submitPost(
    managerCreatedPost.id,
    {
      title: '5 Morning Habits of a Top CS Student [Final Edit]',
      content: chatGPTFormattedCopy,
      content_plain: '5 Morning Habits of a Top CS Student. Success isn\'t about luck...',
      hashtags: ['#StudyRoutine', '#StudentLife', '#Productivity'],
      drive_file_id: '1_DRIVE_VIDEO_FILE_ABC123',
      drive_file_url: 'https://drive.google.com/file/d/1_DRIVE_VIDEO_FILE_ABC123/view',
      drive_file_name: 'day_in_the_life_v1.mp4',
      drive_mime_type: 'video/mp4',
    },
    studentA.id
  );

  assert.strictEqual(submittedPost.status, 'submitted');
  assert(submittedPost.content.includes('<h2>🚀 5 Morning Habits'));
  assert(submittedPost.content.includes('<strong>repeatable daily systems</strong>'));
  assert(submittedPost.content.includes('<blockquote>'));
  assert.strictEqual(submittedPost.content_type, 'video');
  assert.strictEqual(submittedPost.version_count, 1);
  console.log('  ✓ Post submitted with ChatGPT-formatted HTML preserved.');
  console.log('  ✓ Video media attached with metadata (MIME type, file ID, file name).\n');

  // ----------------------------------------------------
  // REQUIREMENT 4b: Student Creates Their Own Post (origin = 'student_created')
  // ----------------------------------------------------
  console.log('PHASE 4b: Student Leo Creates His Own Post in Project...');
  const leoOwnPost = mockDb.createPost({
    project_id: project.id,
    title: 'Top 3 UI Design Trends of 2026',
    assigned_creator_id: studentB.id,
    content_type: 'image',
    target_folder_id: '2_LEO_IMAGES_DRIVE_FOLDER_ID',
    platform: 'linkedin',
    status: 'student_created',
    origin: 'student_created',
    scheduled_date: '2026-11-20T12:00:00Z',
  });

  assert.strictEqual(leoOwnPost.origin, 'student_created');
  assert.strictEqual(leoOwnPost.status, 'student_created');

  // Leo submits his own post with an image
  const submittedLeoPost = mockDb.submitPost(
    leoOwnPost.id,
    {
      title: 'Top 3 UI Design Trends of 2026 (Infographic)',
      content: '<p>Spatial UI and glassmorphism 2.0 are dominating design systems this year.</p>',
      content_plain: 'Spatial UI and glassmorphism 2.0...',
      hashtags: ['#UIDesign', '#DesignTrends', '#UX'],
      drive_file_id: '2_DRIVE_IMAGE_FILE_XYZ456',
      drive_file_url: 'https://drive.google.com/file/d/2_DRIVE_IMAGE_FILE_XYZ456/view',
      drive_file_name: 'ui_trends_carousel.png',
      drive_mime_type: 'image/png',
    },
    studentB.id
  );

  assert.strictEqual(submittedLeoPost.status, 'submitted');
  assert.strictEqual(submittedLeoPost.origin, 'student_created');
  console.log('  ✓ Student created post successfully created and submitted.\n');

  // ----------------------------------------------------
  // REQUIREMENT 5: Manager Review, Side-by-Side Comparison, Revision & Recommendation
  // ----------------------------------------------------
  console.log('PHASE 5: Manager Review, Revision Request & Recommendation to Admin...');
  
  // Manager compares all submitted posts in project side by side
  const projectSubmissions = mockDb.getPostsForProject(project.id).filter(p => p.status === 'submitted');
  assert.strictEqual(projectSubmissions.length, 2, 'Manager sees both assigned and student-created submissions');
  console.log('  ✓ Manager side-by-side comparison view shows ' + projectSubmissions.length + ' submissions.');

  // Manager requests revision on Sara's post first
  const revisionPost = mockDb.updatePostStatus(
    submittedPost.id,
    'revision_required',
    manager.id,
    'Please trim the intro by 3 seconds and sharpen the first heading.'
  );
  assert.strictEqual(revisionPost.status, 'revision_required');
  console.log('  ✓ Manager requested revision with feedback comment.');

  // Sara resubmits revised version
  const resubmittedPost = mockDb.submitPost(
    submittedPost.id,
    {
      title: '5 Morning Habits of a Top CS Student [Revised Cut]',
      content: chatGPTFormattedCopy.replace('5 Morning Habits', '5 High-Impact Morning Habits'),
      content_plain: '5 High-Impact Morning Habits of a Top CS Student...',
      hashtags: ['#StudyRoutine', '#StudentLife', '#Productivity', '#Revised'],
      drive_file_id: '1_DRIVE_VIDEO_FILE_ABC123_v2',
      drive_file_url: 'https://drive.google.com/file/d/1_DRIVE_VIDEO_FILE_ABC123_v2/view',
      drive_file_name: 'day_in_the_life_v2_final.mp4',
      drive_mime_type: 'video/mp4',
    },
    studentA.id
  );
  assert.strictEqual(resubmittedPost.version_count, 2, 'Version count must increment to 2');
  assert.strictEqual(resubmittedPost.status, 'submitted');
  console.log('  ✓ Student resubmitted revision; version count incremented to ' + resubmittedPost.version_count);

  // Manager approves revised version
  const managerApprovedPost = mockDb.updatePostStatus(resubmittedPost.id, 'manager_approved', manager.id);
  assert.strictEqual(managerApprovedPost.status, 'manager_approved');

  // Manager recommends post to Admin with note
  const recommendedPost = mockDb.recommendToAdmin(
    managerApprovedPost.id,
    'High engagement hook, outstanding visual pacing, perfect alignment with Q4 campaign brief.'
  );
  assert.strictEqual(recommendedPost.status, 'recommended_to_admin');
  assert.strictEqual(
    recommendedPost.manager_recommendation_note,
    'High engagement hook, outstanding visual pacing, perfect alignment with Q4 campaign brief.'
  );
  console.log('  ✓ Manager recommended post to Admin with recommendation note.');

  // Verify Manager CANNOT publish directly or bypass Admin approval
  const managerCanPublish = canTransition('recommended_to_admin', 'published');
  assert.strictEqual(managerCanPublish, false, 'Manager must not be able to transition recommended_to_admin directly to published');
  console.log('  ✓ State Machine enforced: Manager CANNOT bypass Admin approval to publish.\n');

  // ----------------------------------------------------
  // REQUIREMENT 6: Admin Final Decision and Publishing Delegation
  // ----------------------------------------------------
  console.log('PHASE 6: Admin Final Decision & Publishing Flow...');
  
  // Admin reviews recommended posts
  const recommendedList = mockDb.getPostsForStatus('recommended_to_admin');
  assert(recommendedList.some(p => p.id === recommendedPost.id));
  console.log('  ✓ Admin views recommended post with Manager recommendation note.');

  // Admin approves post
  const adminApprovedPost = mockDb.updatePostStatus(recommendedPost.id, 'approved', 'admin-001');
  assert.strictEqual(adminApprovedPost.status, 'approved');
  console.log('  ✓ Admin gave final approval.');

  // Admin chooses "Allow Manager to publish"
  const readyToPublishPost = mockDb.updatePost(adminApprovedPost.id, {
    status: 'ready_to_publish',
    publisher: 'manager',
    publisher_id: manager.id,
  });
  assert.strictEqual(readyToPublishPost.status, 'ready_to_publish');
  assert.strictEqual(readyToPublishPost.publisher, 'manager');
  assert.strictEqual(readyToPublishPost.publisher_id, manager.id);
  console.log('  ✓ Admin delegated publishing to Manager (Ready to Publish).');

  // Manager views their "To Publish" queue
  const managerPublishQueue = mockDb.getPostsForUser(manager.id, 'manager')
    .filter(p => p.status === 'ready_to_publish' && p.publisher_id === manager.id);
  assert.strictEqual(managerPublishQueue.length, 1);
  console.log('  ✓ Manager sees delegated post in their "To Publish" queue.');

  // Manager publishes with verified live URL
  const publishedPost = mockDb.markPublished(
    readyToPublishPost.id,
    'https://www.instagram.com/p/DB123456789xyz/',
    manager.id
  );
  assert.strictEqual(publishedPost.status, 'published');
  assert.strictEqual(publishedPost.published_url, 'https://www.instagram.com/p/DB123456789xyz/');
  assert(publishedPost.published_at !== undefined);
  console.log('  ✓ Post published successfully with verified URL: ' + publishedPost.published_url + '\n');

  // ----------------------------------------------------
  // REQUIREMENT 7: Parallel Projects Isolation
  // ----------------------------------------------------
  console.log('PHASE 7: Multi-Project Parallel Scoping & Data Leak Prevention...');
  
  // Create Project 2 with different Manager & Student
  const manager2 = mockDb.createUser({
    email: 'elena.mgr2@agency.com',
    full_name: 'Elena Rostova',
    role: 'manager',
    status: 'active',
  });

  const studentC = mockDb.createUser({
    email: 'devon.student@university.edu',
    full_name: 'Devon Miles',
    role: 'student',
    status: 'active',
  });

  const project2 = mockDb.createProject({
    title: 'Autumn Tech Showcase',
    status: 'active',
    priority: 'medium',
    assigned_manager_id: manager2.id,
    assigned_student_ids: [studentC.id],
    deadline: '2026-12-15T23:59:59Z',
  });

  const postInProject2 = mockDb.createPost({
    project_id: project2.id,
    title: 'Secret Hardware Teaser',
    assigned_creator_id: studentC.id,
    content_type: 'video',
    target_folder_id: 'DEVON_VIDEOS_FOLDER',
    platform: 'youtube',
    status: 'assigned',
    origin: 'manager_created',
  });

  // Check Manager 1 cannot see Project 2
  const manager1Projects = mockDb.getProjectsForUser(manager.id, 'manager');
  assert(!manager1Projects.some(p => p.id === project2.id), 'Manager 1 must NOT see Project 2');
  const manager1Posts = mockDb.getPostsForUser(manager.id, 'manager');
  assert(!manager1Posts.some(p => p.id === postInProject2.id), 'Manager 1 must NOT see Project 2 posts');

  // Check Student Sara cannot see Project 2
  const saraProjects = mockDb.getProjectsForUser(studentA.id, 'student');
  assert(!saraProjects.some(p => p.id === project2.id), 'Student Sara must NOT see Project 2');
  const saraAllPosts = mockDb.getPostsForUser(studentA.id, 'student');
  assert(!saraAllPosts.some(p => p.id === postInProject2.id), 'Student Sara must NOT see Project 2 posts');

  console.log('  ✓ Cross-project isolation confirmed: Manager 1 cannot see Project 2.');
  console.log('  ✓ Cross-project isolation confirmed: Student Sara cannot see Project 2.');
  console.log('  ✓ No data leakage between parallel projects or students.\n');

  console.log('================================================================');
  console.log('  ALL 7 REAL WORKFLOW REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}

runRealWorkflowVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:');
  console.error(err);
  process.exit(1);
});
