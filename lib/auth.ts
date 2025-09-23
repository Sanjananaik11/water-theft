export interface Employee {
  id: number
  employeeId: string
  name: string
  email: string
  role: string
  department: string
  phone?: string
  isActive: boolean
  lastLogin?: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export class AuthService {
  // Simple password hashing (in production, use bcrypt)
  private hashPassword(password: string): string {
    // Simple hash for demo - use bcrypt in production
    return Buffer.from(password).toString("base64")
  }

  // Verify password
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash
  }

  // Generate session token
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private mockEmployees = [
    {
      id: 1,
      employeeId: "EMP001",
      name: "Admin User",
      email: "admin@kandavara.gov.in",
      password: "admin123", // Store plain password for comparison
      role: "Administrator",
      department: "Water Management",
      phone: "+91-9876543210",
      isActive: true,
      lastLogin: new Date(),
    },
    {
      id: 2,
      employeeId: "EMP002",
      name: "Water Inspector",
      email: "inspector@kandavara.gov.in",
      password: "inspector123", // Store plain password for comparison
      role: "Inspector",
      department: "Water Management",
      phone: "+91-9876543211",
      isActive: true,
      lastLogin: new Date(),
    },
  ]

  private sessions = new Map<string, { employeeId: number; expiresAt: Date }>()

  // Login employee
  async login(credentials: LoginCredentials): Promise<{ employee: Employee; token: string } | null> {
    try {
      console.log("[v0] Login attempt for:", credentials.email)

      const mockEmployee = this.mockEmployees.find((emp) => emp.email === credentials.email)

      if (!mockEmployee) {
        console.log("[v0] Employee not found in mock data")
        return null
      }

      if (credentials.password !== mockEmployee.password) {
        console.log("[v0] Password verification failed")
        console.log("[v0] Expected:", mockEmployee.password, "Got:", credentials.password)
        return null
      }

      console.log("[v0] Password verification successful")

      // Generate session token
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      this.sessions.set(sessionToken, { employeeId: mockEmployee.id, expiresAt })

      const employee: Employee = {
        id: mockEmployee.id,
        employeeId: mockEmployee.employeeId,
        name: mockEmployee.name,
        email: mockEmployee.email,
        role: mockEmployee.role,
        department: mockEmployee.department,
        phone: mockEmployee.phone,
        isActive: mockEmployee.isActive,
        lastLogin: new Date(),
      }

      console.log("[v0] Login successful for:", employee.name)
      return { employee, token: sessionToken }
    } catch (error) {
      console.error("[v0] Login failed:", error)
      return null
    }
  }

  // Verify session token
  async verifySession(token: string): Promise<Employee | null> {
    try {
      console.log("[v0] Verifying session token")

      const memorySession = this.sessions.get(token)
      if (memorySession && memorySession.expiresAt > new Date()) {
        const mockEmployee = this.mockEmployees.find((emp) => emp.id === memorySession.employeeId)
        if (mockEmployee) {
          console.log("[v0] Session verified from memory storage")
          return {
            id: mockEmployee.id,
            employeeId: mockEmployee.employeeId,
            name: mockEmployee.name,
            email: mockEmployee.email,
            role: mockEmployee.role,
            department: mockEmployee.department,
            phone: mockEmployee.phone,
            isActive: mockEmployee.isActive,
            lastLogin: mockEmployee.lastLogin,
          }
        }
      }

      console.log("[v0] Session verification failed")
      return null
    } catch (error) {
      console.error("[v0] Session verification error:", error)
      return null
    }
  }

  // Logout
  async logout(token: string): Promise<void> {
    try {
      console.log("[v0] Logging out session")
      this.sessions.delete(token)
    } catch (error) {
      console.error("[v0] Logout failed:", error)
    }
  }
}

export const authService = new AuthService()
