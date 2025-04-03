package auth

// Role constants for the application
const (
	RoleMember    = "member"
	RoleAdmin     = "admin"
	RoleOrganizer = "organizer"
	RoleOwner     = "owner" // Also used in some places
)

// IsAdminRole checks if the provided role has admin privileges
func IsAdminRole(role string) bool {
	return role == RoleAdmin || role == RoleOrganizer || role == RoleOwner
}

// IsOrganizerRole checks if the provided role has organizer privileges
func IsOrganizerRole(role string) bool {
	return role == RoleOrganizer || role == RoleAdmin || role == RoleOwner
}
