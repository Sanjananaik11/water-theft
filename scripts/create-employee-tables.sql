-- Create employee authentication tables for Gramapanchayat staff
-- Add to existing Azure SQL Database schema

-- Create Employees table for authentication
CREATE TABLE Employees (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId NVARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(100) NOT NULL, -- 'admin', 'officer', 'supervisor'
    Department NVARCHAR(100) DEFAULT 'Water Management',
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    LastLogin DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create Sessions table for login tracking
CREATE TABLE EmployeeSessions (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId BIGINT NOT NULL,
    SessionToken NVARCHAR(255) UNIQUE NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeId) REFERENCES Employees(Id)
);

-- Create indexes
CREATE INDEX IX_Employees_Email ON Employees(Email);
CREATE INDEX IX_Employees_EmployeeId ON Employees(EmployeeId);
CREATE INDEX IX_EmployeeSessions_Token ON EmployeeSessions(SessionToken);
CREATE INDEX IX_EmployeeSessions_ExpiresAt ON EmployeeSessions(ExpiresAt);

-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO Employees (EmployeeId, Name, Email, PasswordHash, Role, Phone) VALUES
('EMP001', 'Water Department Admin', 'admin@kandavara.gov.in', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'admin', '+91-9876543220'),
('EMP002', 'Field Officer', 'officer@kandavara.gov.in', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'officer', '+91-9876543221'),
('EMP003', 'Water Supervisor', 'supervisor@kandavara.gov.in', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'supervisor', '+91-9876543222');
