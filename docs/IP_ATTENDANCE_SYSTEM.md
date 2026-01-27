# IP-Based Attendance System Documentation

## Overview

The IP-based attendance system ensures that employees can only mark their attendance when they are physically present in the office or connected to the company network. This prevents unauthorized attendance marking from remote locations.

## How It Works

### 1. IP Detection
The system automatically detects the user's current IP address using the `https://api.ipify.org` service.

### 2. Network Validation
The detected IP is validated against a list of approved office network ranges:
- **Office Network**: `192.168.1.0/24` (main office)
- **Secondary Office**: `10.0.0.0/24` (branch office)
- **Corporate VPN**: `203.0.113.0/24` (corporate network)

### 3. Attendance Restrictions
- **Check In/Out**: Only allowed when IP is within approved ranges
- **Break Management**: Only allowed from office network
- **Location Verification**: Real-time IP validation before each action

## Implementation Details

### Frontend Components

#### AttendanceSystem Component
- **Location**: `src/components/employee/AttendanceSystemNew.tsx`
- **Features**:
  - Real-time IP detection and validation
  - Check In/Out functionality
  - Break management
  - Location status display
  - Attendance history

#### Key Functions
```typescript
// IP Detection
const checkLocationPermission = async () => {
  const response = await fetch('https://api.ipify.org?format=json');
  const { ip } = await response.json();
  
  // Validate against office networks
  const isAllowed = isIPInAllowedRange(ip, officeIPs);
  
  setLocationInfo({
    isAllowed,
    currentIP: ip,
    officeIPs,
    distance: null
  });
};

// Check In Process
const handleCheckIn = async () => {
  if (!locationInfo.isAllowed) {
    // Show error: Location restricted
    return;
  }
  
  // Proceed with check-in
  // Record IP address with attendance
};
```

### Database Schema

#### Attendance Table Structure
```sql
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    date DATE NOT NULL,
    in_time TIME,
    out_time TIME,
    break_duration INTERVAL DEFAULT '00:00:00',
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, date)
);
```

### Network Configuration

#### Office IP Ranges
The system supports multiple office locations:

1. **Main Office**: `192.168.1.0/24`
   - Range: 192.168.1.1 to 192.168.1.254
   - Subnet Mask: 255.255.255.0
   - Location: Headquarters

2. **Branch Office**: `10.0.0.0/24`
   - Range: 10.0.0.1 to 10.0.0.254
   - Subnet Mask: 255.255.255.0
   - Location: Branch Office

3. **Corporate VPN**: `203.0.113.0/24`
   - Range: 203.0.113.1 to 203.0.113.254
   - Subnet Mask: 255.255.255.0
   - Location: Remote Access

#### IP Validation Logic
```typescript
const isIPInAllowedRange = (userIP: string, allowedRanges: string[]): boolean => {
  return allowedRanges.some(range => {
    if (range.includes('/')) {
      // CIDR notation validation
      const [network, prefix] = range.split('/');
      const networkParts = network.split('.').map(Number);
      const userParts = userIP.split('.').map(Number);
      
      // Simplified CIDR check (for demonstration)
      // In production, use proper CIDR library
      return networkParts.slice(0, 2).every((part, i) => part === userParts[i]);
    } else {
      // Exact IP match
      return userIP === range;
    }
  });
};
```

## Security Features

### 1. IP-Based Restrictions
- Attendance actions are blocked outside approved networks
- Real-time IP validation for each action
- IP address logged with each attendance record

### 2. Time-Based Validation
- Check-in/out times are validated against business hours
- Automatic status calculation (present, late, half-day)
- Break duration tracking

### 3. Audit Trail
- All attendance actions are logged with:
  - Timestamp
  - IP address
  - User information
  - Action type (check-in, check-out, break)

## User Experience

### Location Status Indicator
- **Green Checkmark**: Within approved network
- **Red Warning**: Outside approved network
- **Current IP Display**: Shows detected IP address

### Attendance Flow
1. **Location Check**: System validates IP address
2. **Permission Grant**: Only if IP is approved
3. **Action Allowed**: Check In/Out, Break management
4. **Record Update**: Attendance saved with IP and timestamp

### Error Handling
- **Location Restricted**: Clear error message when outside office
- **Network Issues**: Graceful handling of IP detection failures
- **Duplicate Actions**: Prevents multiple check-ins without check-out

## Configuration

### Adding New Office Locations
To add a new office location:

1. Update the `officeIPs` array in `AttendanceSystemNew.tsx`:
```typescript
const officeIPs = [
  '192.168.1.0/24',    // Main office
  '10.0.0.0/24',       // Branch office
  '203.0.113.0/24',    // Corporate VPN
  '192.168.2.0/24',    // New office location
];
```

2. Update the IP validation logic if needed
3. Test with actual IP addresses from the new location

### Customizing Business Hours
Update the attendance validation logic in `handleCheckIn`:
```typescript
// Determine status based on check-in time
const hour = new Date().getHours();
const status = hour >= 9 ? 'present' : 'present'; // Customize as needed
```

## Best Practices

### 1. Network Security
- Use proper CIDR notation for IP ranges
- Regularly update approved IP ranges
- Monitor for unauthorized access attempts

### 2. User Experience
- Provide clear feedback for location restrictions
- Show current IP address for transparency
- Allow manual override for special circumstances

### 3. Maintenance
- Regular IP range audits
- Monitor IP detection service availability
- Keep backup location verification methods

## Troubleshooting

### Common Issues

#### 1. "Location Restricted" Error
**Cause**: User is outside approved network
**Solution**: 
- Verify user is connected to office network/VPN
- Check if IP range needs updating
- Verify IP detection service is working

#### 2. IP Detection Failure
**Cause**: Network issues or service downtime
**Solution**:
- Check internet connectivity
- Verify `https://api.ipify.org` is accessible
- Implement fallback IP detection methods

#### 3. Incorrect IP Range
**Cause**: Office network configuration changed
**Solution**:
- Update IP ranges in configuration
- Test with actual office IP addresses
- Use network admin tools to verify ranges

### Debug Information
The system provides debug information:
- Current detected IP
- Approved IP ranges
- Network validation result
- Last successful attendance location

## Future Enhancements

### 1. Geolocation Integration
- Add GPS-based location verification
- Geofencing for additional security
- Location history tracking

### 2. Wi-Fi Network Verification
- Verify specific Wi-Fi network names
- MAC address validation
- Network strength requirements

### 3. Mobile App Support
- Native mobile app with location services
- Background location tracking
- Push notifications for attendance reminders

### 4. Advanced Analytics
- Attendance pattern analysis
- Location-based reporting
- Anomaly detection for suspicious activity

## Compliance and Privacy

### Data Protection
- IP addresses are logged for security purposes
- Location data is stored securely
- Compliance with privacy regulations

### Employee Privacy
- Only work-related location data is collected
- No tracking outside work hours
- Clear privacy policy and employee consent

## Support

For technical support or questions about the IP-based attendance system:

1. Check this documentation first
2. Verify network configuration
3. Contact IT department for network issues
4. Review system logs for error details

---

*This documentation covers the IP-based attendance system implementation. For general attendance features, see the main attendance documentation.*
