package com.healthcare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
@PrimaryKeyJoinColumn(name = "user_id")
public class Doctor extends User {
    
    @Size(max = 50)
    private String specialization;
    
    @Size(max = 20)
    private String licenseNumber;
    
    @Size(max = 1000)
    private String qualifications;
    
    private Integer yearsOfExperience;
    
    private BigDecimal consultationFee;
    
    @Size(max = 50)
    private String department;
    
    @ElementCollection
    @CollectionTable(name = "doctor_availability", joinColumns = @JoinColumn(name = "doctor_id"))
    private List<String> availableDays = new ArrayList<>();
    
    @Size(max = 500)
    private String bio;

    // Constructors
    public Doctor() {}

    public Doctor(String username, String password, String email, String firstName, String lastName, String specialization) {
        super(username, password, email, firstName, lastName, List.of("DOCTOR"));
        this.specialization = specialization;
    }

    // Getters and Setters
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public List<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(List<String> availableDays) { this.availableDays = availableDays; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
