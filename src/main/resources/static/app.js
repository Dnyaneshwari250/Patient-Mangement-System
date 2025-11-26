const API_BASE_URL = 'http://localhost:8086/api';

let currentUser = null;
let token = localStorage.getItem('token');
let doctors = [];
let appointments = [];
let currentFilter = 'all';

// Modal functions
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
}

function showBookAppointment() {
    if (!currentUser) {
        showLogin();
        return;
    }
    loadDoctors();
    document.getElementById('bookAppointmentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Auth functions
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        showLoading(true, 'login');
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            currentUser = data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data));
            
            closeModal('loginModal');
            showDashboard();
            loadDashboardData();
            showNotification('Login successful!', 'success');
        } else {
            const error = await response.text();
            showNotification(error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Cannot connect to server. Please check if backend is running.', 'error');
    } finally {
        showLoading(false, 'login');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        roles: ['PATIENT']
    };

    // Basic validation
    if (!userData.username || !userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (userData.password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading(true, 'register');
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.text();
            showNotification('Registration successful! Please login.', 'success');
            closeModal('registerModal');
            showLogin();
            // Clear form
            event.target.reset();
        } else {
            const error = await response.text();
            showNotification(error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Cannot connect to server. Please check if backend is running on port 8086.', 'error');
    } finally {
        showLoading(false, 'register');
    }
}

// Appointment functions
async function handleBookAppointment(event) {
    event.preventDefault();
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const appointmentData = {
        patient: { id: currentUser.id },
        doctor: { id: parseInt(formData.get('doctorId')) },
        appointmentDateTime: `${formData.get('appointmentDate')}T${formData.get('appointmentTime')}:00`,
        reason: formData.get('reason'),
        status: 'SCHEDULED'
    };

    try {
        showLoading(true, 'appointment');
        const response = await fetch(`${API_BASE_URL}/appointment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            const appointment = await response.json();
            showNotification('Appointment booked successfully!', 'success');
            closeModal('bookAppointmentModal');
            event.target.reset();
            loadAppointments();
            loadDashboardData();
        } else {
            const error = await response.text();
            showNotification(error || 'Failed to book appointment', 'error');
        }
    } catch (error) {
        console.error('Appointment booking error:', error);
        showNotification('Failed to book appointment. Please try again.', 'error');
    } finally {
        showLoading(false, 'appointment');
    }
}

async function loadDoctors() {
    try {
        const response = await fetch(`${API_BASE_URL}/doctor`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            doctors = await response.json();
            const select = document.getElementById('appointmentDoctor');
            select.innerHTML = '<option value="">Select a doctor</option>';
            
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                const specialization = doctor.specialization || 'General Medicine';
                const experience = doctor.yearsOfExperience ? ` (${doctor.yearsOfExperience} yrs exp)` : '';
                const fee = doctor.consultationFee ? ` - ₹${doctor.consultationFee}` : '';
                option.textContent = `Dr. ${doctor.firstName} ${doctor.lastName} - ${specialization}${experience}${fee}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

async function loadAppointments() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/appointment/patient/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            appointments = await response.json();
            renderAppointments();
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function renderAppointments() {
    const container = document.getElementById('appointmentsList');
    const filteredAppointments = filterAppointments(appointments);
    
    if (filteredAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No appointments found</h3>
                <p>${currentFilter === 'all' ? 'You haven\'t booked any appointments yet.' : `No ${currentFilter} appointments.`}</p>
                <button class="btn-primary" onclick="showBookAppointment()">Book Your First Appointment</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredAppointments.map(appointment => {
        const doctor = doctors.find(d => d.id === appointment.doctor?.id) || appointment.doctor;
        const appointmentDate = new Date(appointment.appointmentDateTime);
        const now = new Date();
        const canCancel = appointment.status === 'SCHEDULED' && appointmentDate > now;
        
        return `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="appointment-doctor">
                        Dr. ${doctor?.firstName} ${doctor?.lastName}
                        ${doctor?.specialization ? `<span style="color: #6b7280; font-size: 0.9em;"> - ${doctor.specialization}</span>` : ''}
                    </div>
                    <span class="appointment-status status-${appointment.status.toLowerCase()}">
                        ${appointment.status}
                    </span>
                </div>
                <div class="appointment-details">
                    <div class="appointment-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${appointmentDate.toLocaleDateString()}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-clock"></i>
                        <span>${appointmentDate.toLocaleTimeString()}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-stethoscope"></i>
                        <span>${appointment.reason || 'General Checkup'}</span>
                    </div>
                    ${doctor?.consultationFee ? `
                    <div class="appointment-detail">
                        <i class="fas fa-rupee-sign"></i>
                        <span>Fee: ₹${doctor.consultationFee}</span>
                    </div>
                    ` : ''}
                </div>
                ${appointment.notes ? `
                    <div class="appointment-detail">
                        <i class="fas fa-file-medical"></i>
                        <span><strong>Notes:</strong> ${appointment.notes}</span>
                    </div>
                ` : ''}
                <div class="appointment-actions">
                    ${canCancel ? `
                        <button class="btn-sm btn-danger" onclick="cancelAppointment(${appointment.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-outline" onclick="viewAppointmentDetails(${appointment.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    ${doctor?.availableDays?.length > 0 ? `
                        <button class="btn-sm btn-outline" onclick="showDoctorAvailability(${doctor.id})">
                            <i class="fas fa-calendar-check"></i> Availability
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterAppointments(appointments) {
    if (currentFilter === 'all') return appointments;
    return appointments.filter(apt => apt.status.toLowerCase() === currentFilter.toLowerCase());
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    renderAppointments();
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/appointment/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'CANCELLED' })
        });

        if (response.ok) {
            showNotification('Appointment cancelled successfully', 'success');
            loadAppointments();
            loadDashboardData();
        } else {
            throw new Error('Failed to cancel appointment');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showNotification('Failed to cancel appointment', 'error');
    }
}

function viewAppointmentDetails(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        const doctor = doctors.find(d => d.id === appointment.doctor?.id) || appointment.doctor;
        const date = new Date(appointment.appointmentDateTime);
        
        let details = `DOCTOR DETAILS:\n`;
        details += `Dr. ${doctor?.firstName} ${doctor?.lastName}\n`;
        details += `Specialization: ${doctor?.specialization || 'General Medicine'}\n`;
        if (doctor?.yearsOfExperience) details += `Experience: ${doctor.yearsOfExperience} years\n`;
        if (doctor?.qualifications) details += `Qualifications: ${doctor.qualifications}\n\n`;
        
        details += `APPOINTMENT DETAILS:\n`;
        details += `Date: ${date.toLocaleDateString()}\n`;
        details += `Time: ${date.toLocaleTimeString()}\n`;
        details += `Status: ${appointment.status}\n`;
        details += `Reason: ${appointment.reason || 'Not specified'}\n`;
        if (appointment.notes) details += `Notes: ${appointment.notes}\n`;
        if (appointment.diagnosis) details += `Diagnosis: ${appointment.diagnosis}\n`;
        if (appointment.prescription) details += `Prescription: ${appointment.prescription}\n`;
        
        alert(details);
    }
}

function showDoctorAvailability(doctorId) {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor && doctor.availableDays && doctor.availableDays.length > 0) {
        const availability = `Dr. ${doctor.firstName} ${doctor.lastName} is available on:\n\n${doctor.availableDays.join(', ')}`;
        alert(availability);
    } else {
        alert('Availability information not available for this doctor.');
    }
}

// Navigation functions
function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard').classList.remove('hidden');
    updateActiveNav('dashboard');
    loadDashboardData();
}

function showAppointments() {
    if (!currentUser) {
        showLogin();
        return;
    }
    hideAllSections();
    document.getElementById('appointments').classList.remove('hidden');
    updateActiveNav('appointments');
    loadAppointments();
    
    // Add filter tabs if not already added
    const container = document.getElementById('appointmentsList');
    if (!document.querySelector('.filter-tabs')) {
        const filterTabs = `
            <div class="filter-tabs">
                <div class="filter-tab active" data-filter="all" onclick="setFilter('all')">All</div>
                <div class="filter-tab" data-filter="scheduled" onclick="setFilter('scheduled')">Scheduled</div>
                <div class="filter-tab" data-filter="confirmed" onclick="setFilter('confirmed')">Confirmed</div>
                <div class="filter-tab" data-filter="completed" onclick="setFilter('completed')">Completed</div>
                <div class="filter-tab" data-filter="cancelled" onclick="setFilter('cancelled')">Cancelled</div>
            </div>
        `;
        container.insertAdjacentHTML('beforebegin', filterTabs);
    }
}

function showDoctors() {
    if (!currentUser) {
        showLogin();
        return;
    }
    hideAllSections();
    // Create doctors section if it doesn't exist
    if (!document.getElementById('doctors')) {
        const doctorsSection = document.createElement('div');
        doctorsSection.id = 'doctors';
        doctorsSection.className = 'doctors-section hidden';
        doctorsSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2>Our Doctors</h2>
                </div>
                <div class="doctors-grid" id="doctorsGrid"></div>
            </div>
        `;
        document.body.appendChild(doctorsSection);
    }
    document.getElementById('doctors').classList.remove('hidden');
    updateActiveNav('doctors');
    loadDoctorsForDisplay();
}

async function loadDoctorsForDisplay() {
    try {
        const response = await fetch(`${API_BASE_URL}/doctor`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const doctorsList = await response.json();
            const container = document.getElementById('doctorsGrid');
            container.innerHTML = doctorsList.map(doctor => `
                <div class="doctor-card">
                    <div class="doctor-header">
                        <div class="doctor-avatar">
                            ${doctor.firstName[0]}${doctor.lastName[0]}
                        </div>
                        <div class="doctor-info">
                            <h3>Dr. ${doctor.firstName} ${doctor.lastName}</h3>
                            <p class="doctor-specialty">${doctor.specialization || 'General Medicine'}</p>
                        </div>
                    </div>
                    <div class="doctor-details">
                        ${doctor.qualifications ? `<p><i class="fas fa-graduation-cap"></i> ${doctor.qualifications}</p>` : ''}
                        ${doctor.yearsOfExperience ? `<p><i class="fas fa-briefcase"></i> ${doctor.yearsOfExperience} years experience</p>` : ''}
                        ${doctor.consultationFee ? `<p><i class="fas fa-rupee-sign"></i> Consultation Fee: ₹${doctor.consultationFee}</p>` : ''}
                        ${doctor.department ? `<p><i class="fas fa-hospital"></i> ${doctor.department} Department</p>` : ''}
                        ${doctor.availableDays?.length > 0 ? `<p><i class="fas fa-calendar"></i> Available: ${doctor.availableDays.join(', ')}</p>` : ''}
                    </div>
                    ${doctor.bio ? `<div class="doctor-bio"><p>${doctor.bio}</p></div>` : ''}
                    <div class="doctor-actions">
                        <button class="btn-primary" onclick="showBookAppointmentWithDoctor(${doctor.id})">
                            <i class="fas fa-calendar-plus"></i> Book Appointment
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

function showBookAppointmentWithDoctor(doctorId) {
    showBookAppointment();
    // Set the doctor in the dropdown after a short delay
    setTimeout(() => {
        const select = document.getElementById('appointmentDoctor');
        if (select) {
            select.value = doctorId;
        }
    }, 100);
}

function hideAllSections() {
    document.querySelectorAll('.hero, .features, #dashboard, #appointments, #doctors').forEach(section => {
        section.classList.add('hidden');
    });
}

function updateActiveNav(target) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const targetLink = document.querySelector(`.nav-link[href="#${target}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

async function loadDashboardData() {
    if (!token) return;

    try {
        // Load patients count
        const patientsResponse = await fetch(`${API_BASE_URL}/patient`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (patientsResponse.ok) {
            const patients = await patientsResponse.json();
            document.getElementById('patientCount').textContent = patients.length;
        }

        // Load doctors count
        const doctorsResponse = await fetch(`${API_BASE_URL}/doctor`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (doctorsResponse.ok) {
            const doctors = await doctorsResponse.json();
            document.getElementById('doctorCount').textContent = doctors.length;
        }

        // Load appointments count
        const appointmentsResponse = await fetch(`${API_BASE_URL}/appointment`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (appointmentsResponse.ok) {
            const appointments = await appointmentsResponse.json();
            document.getElementById('appointmentCount').textContent = appointments.length;
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    
    // Reset UI
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('.features').classList.remove('hidden');
    hideAllSections();
    
    // Reset nav
    updateActiveNav('dashboard');
    
    // Reset auth buttons
    const navAuth = document.querySelector('.nav-auth');
    navAuth.innerHTML = `
        <button class="btn-login" onclick="showLogin()">Login</button>
        <button class="btn-register" onclick="showRegister()">Register</button>
    `;
    
    showNotification('Logged out successfully', 'success');
}

function showDemo() {
    // Fill demo credentials and show login
    document.getElementById('username').value = 'patient1';
    document.getElementById('password').value = 'password123';
    showLogin();
}

function showLoading(show, type) {
    const buttons = {
        login: document.querySelector('#loginForm button[type="submit"]'),
        register: document.querySelector('#registerForm button[type="submit"]'),
        appointment: document.querySelector('#appointmentForm button[type="submit"]')
    };
    
    const button = buttons[type];
    if (button) {
        if (show) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.innerHTML = `<span class="spinner"></span>${originalText.replace('Login', 'Logging in...').replace('Create Account', 'Creating Account...').replace('Book Appointment', 'Booking...')}`;
        } else {
            button.disabled = false;
            button.innerHTML = button.innerHTML.replace(`<span class="spinner"></span>`, '').replace('Logging in...', 'Login').replace('Creating Account...', 'Create Account').replace('Booking...', 'Book Appointment');
        }
    }
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Check if user is already logged in
window.onload = function() {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
            loadDashboardData();
        } catch (e) {
            console.error('Error parsing saved user:', e);
            logout();
        }
    }
    
    // Test backend connection
    testBackend();
    
    // Set minimum date for appointment booking to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate')?.setAttribute('min', today);
};

async function testBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/health`);
        if (response.ok) {
            console.log('Backend connection: OK');
            showNotification('Backend connected successfully!', 'success');
        } else {
            console.log('Backend connection: FAILED - Server error');
            showNotification('Backend server error', 'error');
        }
    } catch (error) {
        console.log('Backend connection: FAILED - Network error');
        showNotification('Cannot connect to backend server. Make sure it\'s running on port 8086.', 'error');
    }
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.getAttribute('href').substring(1);
        
        if (target === 'dashboard') {
            showDashboard();
        } else if (target === 'appointments') {
            showAppointments();
        } else if (target === 'doctors') {
            showDoctors();
        } else if (target === 'patients') {
            if (!currentUser) {
                showLogin();
            } else {
                showNotification('Patient management feature is coming soon!', 'info');
            }
        }
    });
});
