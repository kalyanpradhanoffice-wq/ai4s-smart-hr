/**
 * AI4S Smart HR - Shift Definitions
 * 
 * Rules:
 * P: In-punch within 15min grace after shift start (Grace period actually starts 30min BEFORE shift start)
 * L: In-punch between 16min and 60min after shift start
 * HD: In-punch between 61min after shift start and Midpoint (approx 4 hours)
 * A: In-punch after Midpoint or No Punch
 * EO: Out-punch before 15min of shift end
 */

export const SHIFTS = {
    GS: {
        name: 'General Shift',
        start: '09:30',
        end: '18:00',
        windows: {
            present: '09:45',
            late: '10:30',
            halfDay: '13:30',
            absent: '13:31',
            earlyOut: '17:45'
        }
    },
    MS: {
        name: 'Morning Shift',
        start: '07:00',
        end: '15:30',
        windows: {
            present: '07:15',
            late: '08:00',
            halfDay: '11:00',
            absent: '11:01',
            earlyOut: '15:15'
        }
    },
    ES: {
        name: 'Evening Shift',
        start: '14:00',
        end: '22:30',
        windows: {
            present: '14:15',
            late: '15:00',
            halfDay: '18:00',
            absent: '18:01',
            earlyOut: '22:15'
        }
    },
    NS: {
        name: 'Night Shift',
        start: '22:00',
        end: '06:30', // Next Day
        windows: {
            present: '22:15',
            late: '23:00',
            halfDay: '02:00',
            absent: '02:01',
            earlyOut: '06:15'
        },
        isOvernight: true
    }
};

export const DEFAULT_SHIFT = 'GS';
