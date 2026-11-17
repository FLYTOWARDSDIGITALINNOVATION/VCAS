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

  // Super Admin / Admin / Principal can view all notices
  const isSuperAdmin = role === 'Super Admin' || role === 'SuperAdmin' || user.isSuperAdmin === true;
  const isAdmin = isSuperAdmin || role === 'Admin' || designation.includes('principal');
  if (isAdmin) return true;

  // Author can always see their own notice
  if (user.staffId && (notice.postedByStaffId === user.staffId)) return true;
  if (user.name && (notice.postedBy === user.name || notice.author === user.name)) return true;

  // If notice is assigned to a specific person:
  // ONLY that assigned person (and Admins/Author checked above) can view it.
  // Other staff or anyone else should NOT be able to view it.
  const assignedStaffId = (notice.assignedToStaffId || notice.assignedTo?.staffId || '').trim();
  const assignedStaffName = (notice.assignedToStaffName || notice.assignedTo?.name || '').trim().toLowerCase();
  const isAssignedToSpecificPerson = Boolean(assignedStaffId || assignedStaffName);

  if (isAssignedToSpecificPerson) {
    const isAssignedUser = (
      (assignedStaffId && user.staffId && user.staffId === assignedStaffId) ||
      (assignedStaffName && user.name && user.name.trim().toLowerCase() === assignedStaffName)
    );
    return Boolean(isAssignedUser);
  }

  const rawAudience = (notice.targetAudience || 'All').trim().toLowerCase();

  // "All" or "Everyone" is visible to everyone
  if (
    rawAudience === 'all' ||
    rawAudience === 'everyone' ||
    rawAudience.includes('everyone') ||
    rawAudience === 'all staff & students'
  ) {
    return true;
  }

  const isStudent = role === 'Student';
  const isHod = Boolean(user.isHod || role === 'HOD' || designation.includes('hod') || designation.includes('head of department'));
  const isAccountantOrOffice =
    role === 'Accountant' ||
    role === 'Office Staff' ||
    designation === 'accountant' ||
    designation === 'office staff' ||
    department.includes('account') ||
    department.includes('office');

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

