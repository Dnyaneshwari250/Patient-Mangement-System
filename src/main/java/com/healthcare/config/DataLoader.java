package com.healthcare.config;

import com.healthcare.entity.*;
import com.healthcare.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Only load data if no users exist
        if (userRepository.count() == 0) {
            loadSampleData();
        }
    }

    private void loadSampleData() {
        System.out.println("Loading sample data...");

        // Create users with encoded passwords
        User admin = createUser("admin", "password123", "admin@healthcare.com", "System", "Admin", "+1234567890", List.of("ADMIN"));
        User doctor1 = createUser("doctor1", "password123", "doctor1@healthcare.com", "Sarah", "Wilson", "+1234567891", List.of("DOCTOR"));
        User patient1 = createUser("patient1", "password123", "patient1@healthcare.com", "Mike", "Johnson", "+1234567892", List.of("PATIENT"));
        User drShindeUser = createUser("drshinde", "password123", "dr.shinde@healthcare.com", "Rajesh", "Shinde", "+919876543210", List.of("DOCTOR"));
        User drVeerUser = createUser("drveer", "password123", "dr.veer@healthcare.com", "Veer", "Patil", "+919876543211", List.of("DOCTOR"));

        // Create doctors - use the existing user IDs
        createDoctor(doctor1, "Cardiology", "LIC123456", "MD, DM Cardiology, AIIMS Delhi", 
                    12, new BigDecimal("1500.00"), "Cardiology", 
                    "Senior Cardiologist with 12 years of experience in interventional cardiology. Specialized in angioplasty and heart failure management.",
                    Arrays.asList("Monday", "Wednesday", "Friday"));

        createDoctor(drShindeUser, "Orthopedics", "LIC789012", "MS Orthopedics, MBBS, D Ortho", 
                    15, new BigDecimal("1200.00"), "Orthopedics", 
                    "Dr. Rajesh Shinde is a renowned orthopedic surgeon with 15 years of experience. Specialized in joint replacement and sports injuries.",
                    Arrays.asList("Tuesday", "Thursday", "Saturday"));

        createDoctor(drVeerUser, "Neurology", "LIC345678", "DM Neurology, MD Medicine, MBBS", 
                    10, new BigDecimal("1800.00"), "Neurology", 
                    "Dr. Veer Patil is a leading neurologist with expertise in stroke management, epilepsy, and movement disorders. 10+ years of clinical experience.",
                    Arrays.asList("Monday", "Wednesday", "Friday", "Saturday"));

        // Create patient
        createPatient(patient1, "O+", 175.0, 70.0, "Hypertension controlled with medication", 
                     "Penicillin", "Jane Johnson", "+1234567893");

        // Create sample appointments
        Doctor drShinde = doctorRepository.findById(drShindeUser.getId()).orElseThrow();
        Doctor drVeer = doctorRepository.findById(drVeerUser.getId()).orElseThrow();
        Patient patient = patientRepository.findById(patient1.getId()).orElseThrow();

        createAppointment(patient, drShinde, LocalDateTime.now().plusDays(1), 
                         "SCHEDULED", "Knee pain consultation", 
                         "Patient complains of persistent knee pain for 2 months");

        createAppointment(patient, drVeer, LocalDateTime.now().plusDays(2), 
                         "CONFIRMED", "Headache and dizziness", 
                         "Frequent headaches and occasional dizziness reported");

        System.out.println("Sample data loaded successfully!");
        System.out.println("=== Demo Credentials ===");
        System.out.println("Admin: admin / password123");
        System.out.println("Doctor1: doctor1 / password123");
        System.out.println("Patient1: patient1 / password123");
        System.out.println("Dr. Shinde: drshinde / password123");
        System.out.println("Dr. Veer: drveer / password123");
        System.out.println("========================");
    }

    private User createUser(String username, String password, String email, String firstName, String lastName, String phone, List<String> roles) {
        User user = new User(username, passwordEncoder.encode(password), email, firstName, lastName, roles);
        user.setPhone(phone);
        return userRepository.save(user);
    }

    private void createDoctor(User user, String specialization, String licenseNumber, String qualifications,
                            int yearsOfExperience, BigDecimal consultationFee, String department, String bio, 
                            List<String> availableDays) {
        Doctor doctor = new Doctor();
        doctor.setId(user.getId()); // Use the same ID as the user
        doctor.setUsername(user.getUsername());
        doctor.setPassword(user.getPassword());
        doctor.setEmail(user.getEmail());
        doctor.setFirstName(user.getFirstName());
        doctor.setLastName(user.getLastName());
        doctor.setPhone(user.getPhone());
        doctor.setRoles(user.getRoles());
        doctor.setSpecialization(specialization);
        doctor.setLicenseNumber(licenseNumber);
        doctor.setQualifications(qualifications);
        doctor.setYearsOfExperience(yearsOfExperience);
        doctor.setConsultationFee(consultationFee);
        doctor.setDepartment(department);
        doctor.setBio(bio);
        doctor.setAvailableDays(availableDays);
        doctorRepository.save(doctor);
    }

    private void createPatient(User user, String bloodType, Double height, Double weight, 
                              String medicalHistory, String allergies, String emergencyContactName, 
                              String emergencyContactPhone) {
        Patient patient = new Patient();
        patient.setId(user.getId()); // Use the same ID as the user
        patient.setUsername(user.getUsername());
        patient.setPassword(user.getPassword());
        patient.setEmail(user.getEmail());
        patient.setFirstName(user.getFirstName());
        patient.setLastName(user.getLastName());
        patient.setPhone(user.getPhone());
        patient.setRoles(user.getRoles());
        patient.setBloodType(bloodType);
        patient.setHeight(height);
        patient.setWeight(weight);
        patient.setMedicalHistory(medicalHistory);
        patient.setAllergies(allergies);
        patient.setEmergencyContactName(emergencyContactName);
        patient.setEmergencyContactPhone(emergencyContactPhone);
        patientRepository.save(patient);
    }

    private void createAppointment(Patient patient, Doctor doctor, LocalDateTime appointmentDateTime, 
                                  String status, String reason, String notes) {
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDateTime(appointmentDateTime);
        appointment.setEndDateTime(appointmentDateTime.plusHours(1));
        appointment.setStatus(status);
        appointment.setReason(reason);
        appointment.setNotes(notes);
        appointmentRepository.save(appointment);
    }
}
