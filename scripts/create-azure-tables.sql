-- Create database schema for Azure SQL Database
-- Water Theft Detection System - Kandavara Panchayat

-- Create Households table
CREATE TABLE Households (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Location NVARCHAR(255) NOT NULL,
    Ward NVARCHAR(50),
    ContactEmail NVARCHAR(255),
    ContactPhone NVARCHAR(20),
    NormalFlowRate FLOAT DEFAULT 45.0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create Devices table
CREATE TABLE Devices (
    Id NVARCHAR(50) PRIMARY KEY,
    HouseholdId NVARCHAR(50) NOT NULL,
    DeviceType NVARCHAR(50) DEFAULT 'water_sensor',
    Status NVARCHAR(20) DEFAULT 'active',
    LastSeen DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (HouseholdId) REFERENCES Households(Id)
);

-- Create WaterReadings table
CREATE TABLE WaterReadings (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    HouseholdId NVARCHAR(50) NOT NULL,
    DeviceId NVARCHAR(50) NOT NULL,
    FlowRate FLOAT NOT NULL,
    Pressure FLOAT NOT NULL,
    Temperature FLOAT,
    Timestamp DATETIME2 NOT NULL,
    AnomalyScore FLOAT,
    AnomalyType NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (HouseholdId) REFERENCES Households(Id),
    FOREIGN KEY (DeviceId) REFERENCES Devices(Id)
);

-- Create Alerts table
CREATE TABLE Alerts (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    HouseholdId NVARCHAR(50) NOT NULL,
    AlertType NVARCHAR(50) NOT NULL,
    Severity NVARCHAR(20) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Timestamp DATETIME2 NOT NULL,
    Acknowledged BIT DEFAULT 0,
    AcknowledgedBy NVARCHAR(255),
    AcknowledgedAt DATETIME2,
    ResolvedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (HouseholdId) REFERENCES Households(Id)
);

-- Create AlertRules table
CREATE TABLE AlertRules (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleName NVARCHAR(255) NOT NULL,
    AlertType NVARCHAR(50) NOT NULL,
    Condition NVARCHAR(MAX) NOT NULL,
    Threshold FLOAT,
    Severity NVARCHAR(20) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create NotificationRecipients table
CREATE TABLE NotificationRecipients (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(20),
    Role NVARCHAR(100) NOT NULL,
    NotificationChannels NVARCHAR(255) DEFAULT 'email,sms',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_WaterReadings_HouseholdId_Timestamp ON WaterReadings(HouseholdId, Timestamp DESC);
CREATE INDEX IX_WaterReadings_Timestamp ON WaterReadings(Timestamp DESC);
CREATE INDEX IX_Alerts_HouseholdId_Timestamp ON Alerts(HouseholdId, Timestamp DESC);
CREATE INDEX IX_Alerts_Acknowledged ON Alerts(Acknowledged, Timestamp DESC);

-- Insert sample data
INSERT INTO Households (Id, Name, Location, Ward, ContactEmail, ContactPhone, NormalFlowRate) VALUES
('H001', 'Rajesh Kumar', 'Ward 1, Street 1', 'Ward 1', 'rajesh@example.com', '+91-9876543210', 45.0),
('H002', 'Priya Sharma', 'Ward 1, Street 2', 'Ward 1', 'priya@example.com', '+91-9876543211', 38.0),
('H003', 'Amit Patel', 'Ward 2, Street 1', 'Ward 2', 'amit@example.com', '+91-9876543212', 52.0),
('H004', 'Sunita Devi', 'Ward 2, Street 3', 'Ward 2', 'sunita@example.com', '+91-9876543213', 41.0),
('H005', 'Ravi Singh', 'Ward 3, Street 2', 'Ward 3', 'ravi@example.com', '+91-9876543214', 47.0);

INSERT INTO Devices (Id, HouseholdId, DeviceType, Status) VALUES
('D001', 'H001', 'water_sensor', 'active'),
('D002', 'H002', 'water_sensor', 'active'),
('D003', 'H003', 'water_sensor', 'active'),
('D004', 'H004', 'water_sensor', 'active'),
('D005', 'H005', 'water_sensor', 'active');

INSERT INTO AlertRules (RuleName, AlertType, Condition, Threshold, Severity) VALUES
('High Flow Rate', 'theft', 'flow_rate > normal_flow * 1.5', 1.5, 'high'),
('Continuous Flow', 'leak', 'continuous_flow > 2 hours', 2.0, 'medium'),
('Zero Flow', 'blockage', 'flow_rate = 0 for > 1 hour', 0.0, 'high'),
('Pressure Drop', 'blockage', 'pressure < 1.5 bar', 1.5, 'medium'),
('Night Usage', 'theft', 'flow_rate > 10 L/min between 11PM-5AM', 10.0, 'medium');

INSERT INTO NotificationRecipients (Name, Email, Phone, Role, NotificationChannels) VALUES
('Water Department Head', 'head@kandavara.gov.in', '+91-9876543220', 'administrator', 'email,sms,whatsapp'),
('Field Officer 1', 'officer1@kandavara.gov.in', '+91-9876543221', 'field_officer', 'email,sms'),
('Field Officer 2', 'officer2@kandavara.gov.in', '+91-9876543222', 'field_officer', 'email,sms'),
('Emergency Contact', 'emergency@kandavara.gov.in', '+91-9876543223', 'emergency', 'sms,whatsapp');
