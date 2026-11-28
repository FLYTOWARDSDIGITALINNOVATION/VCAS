/**
 * Helper to determine if a notice is visible to a given user based on targetAudience.
 *
 * Rules:
 * - Admin / Super Admin / Principal: can see all notices for administrative oversight.
 * - Author of the notice: can always see their own notice.
 * - 'All' / 'Everyone': visible to everyone (Students, Staff, HOD, Accountant, Admin).
 * - 'Students': visible to Students and Admins.
 * - 'HODs': visible ONLY to HODs and Admins (NOT visible to regular Staff, Accountant, or Students).
 * - 'Staff': visible to Staff, HODs, Accountant/Office, and Admins (NOT Students).
 * - 'Administration': visible to Admin, Accountant/Office, and HODs (NOT regular teaching Staff, NOT Students).
 */
export function isNoticeVisible(notice, user) {
  if (!notice) return false;
  if (!user) return true; // fallback if user context is missing

  const role = (user.role || '').trim();
  const designation = (user.designation || '').trim().toLowerCase();
  const department = (user.department || '').trim().toLowerCase();
  const userStaffId = String(user.staffId || user.id || user._id || '').trim().toLowerCase();
  const userName = String(user.name || user.fullName || '').trim().toLowerCase();
  const userEmail = String(user.email || '').trim().toLowerCase();

  // Super Admin / Admin / Principal can view all notices
  const isSuperAdmin = role === 'Super Admin' || role === 'SuperAdmin' || user.isSuperAdmin === true;
  const isAdmin = isSuperAdmin || role === 'Admin' || designation.includes('principal');
  if (isAdmin) return true;

  // Author can always see their own notice
  if (userStaffId && notice.postedByStaffId && String(notice.postedByStaffId).trim().toLowerCase() === userStaffId) return true;
  if (userName && (
    String(notice.postedBy || '').trim().toLowerCase().includes(userName) ||
    String(notice.author || '').trim().toLowerCase().includes(userName)
  )) return true;

  // If notice is assigned to a specific person:
  // ONLY that assigned person (and Admins/Author checked above) can view it.
  // Other staff or anyone else MUST NOT be able to view it.
  const assignedStaffId = String(notice.assignedToStaffId || notice.assignedTo?.staffId || notice.assignedTo?._id || '').trim().toLowerCase();
  const assignedStaffName = String(notice.assignedToStaffName || notice.assignedTo?.name || '').trim().toLowerCase();
  const isAssignedToSpecificPerson = Boolean(assignedStaffId || assignedStaffName);

  if (isAssignedToSpecificPerson) {
    const isAssignedUser = (
      (assignedStaffId && (
        userStaffId === assignedStaffId ||
        String(user.staffId || '').trim().toLowerCase() === assignedStaffId ||
        String(user.id || '').trim().toLowerCase() === assignedStaffId ||
        String(user._id || '').trim().toLowerCase() === assignedStaffId
      )) ||
      (assignedStaffName && (
        userName === assignedStaffName ||
        userName.includes(assignedStaffName) ||
        assignedStaffName.includes(userName)
      ))
    );
    return Boolean(isAssignedUser);
  }

  const rawAudience = (notice.targetAudience || 'All').trim().toLowerCase();

  const isStudent = role === 'Student';
  const isHod = Boolean(user.isHod || role === 'HOD' || designation.includes('hod') || designation.includes('head of department'));
  const isAccountantOrOffice =
    role === 'Accountant' ||
    role === 'Office Staff' ||
    designation === 'accountant' ||
    designation === 'office staff' ||
    department.includes('account') ||
    department.includes('office');

  // Notice targeted specifically to Accountant / Finance / Accounts
  if (
    rawAudience === 'accountant' ||
    rawAudience === 'accountants' ||
    rawAudience.includes('accountant') ||
    rawAudience.includes('accounts') ||
    rawAudience === 'finance'
  ) {
    // ONLY Accountant / Office staff can view it. Regular staff and students MUST NOT see it!
    return Boolean(isAccountantOrOffice);
  }

  // "All" or "Everyone" is visible to everyone
  if (
    rawAudience === 'all' ||
    rawAudience === 'everyone' ||
    rawAudience.includes('everyone') ||
    rawAudience === 'all staff & students'
  ) {
    return true;
  }

  if (isStudent) {
    return rawAudience === 'students' || rawAudience === 'all students';
  }

  // Notice targeted to HODs: ONLY HODs (and Admins) can see it!
  // Accountant, regular Staff, and Students MUST NOT see it!
  if (rawAudience === 'hods' || rawAudience === 'hod') {
    return isHod;
  }

  // Notice targeted to Students: Staff/Accountant should NOT see it
  if (rawAudience === 'students' || rawAudience === 'all students') {
    return false;
  }

  // Notice targeted to Administration:
  if (rawAudience === 'administration' || rawAudience === 'office') {
    return isAccountantOrOffice || isHod;
  }

  // Notice targeted to Staff / Faculty:
  if (
    rawAudience === 'staff' ||
    rawAudience === 'faculty' ||
    rawAudience === 'all faculty & staff'
  ) {
    return !isStudent; // All staff roles including HOD and Accountant
  }

  return false;
}

