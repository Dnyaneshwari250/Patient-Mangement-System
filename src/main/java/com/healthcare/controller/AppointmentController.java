package com.healthcare.controller;

import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import com.healthcare.service.AppointmentService;
import com.healthcare.service.DoctorService;
import com.healthcare.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/appointment")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        return appointment.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
        // Validate patient and doctor exist
        if (appointment.getPatient() == null || appointment.getPatient().getId() == null) {
            return ResponseEntity.badRequest().body("Patient ID is required");
        }
        if (appointment.getDoctor() == null || appointment.getDoctor().getId() == null) {
            return ResponseEntity.badRequest().body("Doctor ID is required");
        }

        Optional<Patient> patient = patientService.getPatientById(appointment.getPatient().getId());
        Optional<Doctor> doctor = doctorService.getDoctorById(appointment.getDoctor().getId());

        if (patient.isEmpty() || doctor.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid patient or doctor ID");
        }

        appointment.setPatient(patient.get());
        appointment.setDoctor(doctor.get());
        
        if (appointment.getStatus() == null) {
            appointment.setStatus("SCHEDULED");
        }

        Appointment savedAppointment = appointmentService.saveAppointment(appointment);
        return ResponseEntity.ok(savedAppointment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        if (appointment.isPresent()) {
            Appointment existingAppointment = appointment.get();
            existingAppointment.setAppointmentDateTime(appointmentDetails.getAppointmentDateTime());
            existingAppointment.setEndDateTime(appointmentDetails.getEndDateTime());
            existingAppointment.setStatus(appointmentDetails.getStatus());
            existingAppointment.setReason(appointmentDetails.getReason());
            existingAppointment.setNotes(appointmentDetails.getNotes());
            existingAppointment.setDiagnosis(appointmentDetails.getDiagnosis());
            existingAppointment.setPrescription(appointmentDetails.getPrescription());
            
            return ResponseEntity.ok(appointmentService.saveAppointment(existingAppointment));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        if (appointmentService.getAppointmentById(id).isPresent()) {
            appointmentService.deleteAppointment(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or (hasRole('PATIENT') and #patientId == principal.id)")
    public List<Appointment> getAppointmentsByPatient(@PathVariable Long patientId) {
        Optional<Patient> patient = patientService.getPatientById(patientId);
        return patient.map(appointmentService::getAppointmentsByPatient).orElse(List.of());
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<Appointment> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        Optional<Doctor> doctor = doctorService.getDoctorById(doctorId);
        return doctor.map(appointmentService::getAppointmentsByDoctor).orElse(List.of());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<Appointment> getAppointmentsByStatus(@PathVariable String status) {
        return appointmentService.getAppointmentsByStatus(status);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<Appointment> getAppointmentsBetweenDates(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return appointmentService.getAppointmentsBetweenDates(start, end);
    }
}
