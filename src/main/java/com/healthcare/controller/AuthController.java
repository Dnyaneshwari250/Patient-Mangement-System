package com.healthcare.controller;

import com.healthcare.dto.JwtResponse;
import com.healthcare.dto.LoginRequest;
import com.healthcare.dto.SignupRequest;
import com.healthcare.entity.User;
import com.healthcare.repository.UserRepository;
import com.healthcare.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtil jwtUtil;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("Login attempt for user: " + loginRequest.getUsername());
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtil.generateToken((org.springframework.security.core.userdetails.User) authentication.getPrincipal());
            
            org.springframework.security.core.userdetails.User userDetails = 
                (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
            
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            System.out.println("Login successful for user: " + user.getUsername());
            return ResponseEntity.ok(new JwtResponse(jwt, 
                                                     user.getId(),
                                                     user.getUsername(), 
                                                     user.getEmail(), 
                                                     roles));
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: Invalid credentials");
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        System.out.println("Registration attempt for: " + signUpRequest.getUsername());
        System.out.println("Email: " + signUpRequest.getEmail());
        System.out.println("First Name: " + signUpRequest.getFirstName());
        System.out.println("Last Name: " + signUpRequest.getLastName());
        
        try {
            // Check if username exists
            if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                System.out.println("Username already exists: " + signUpRequest.getUsername());
                return ResponseEntity.badRequest().body("Error: Username is already taken!");
            }

            // Check if email exists
            if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                System.out.println("Email already exists: " + signUpRequest.getEmail());
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
            }

            // Create new user - use simple User entity instead of Patient for now
            User user = new User(
                signUpRequest.getUsername(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getEmail(),
                signUpRequest.getFirstName(),
                signUpRequest.getLastName()
            );

            user.setPhone(signUpRequest.getPhone());
            System.out.println("Creating user: " + user.getUsername());

            User savedUser = userRepository.save(user);
            System.out.println("User saved successfully with ID: " + savedUser.getId());

            return ResponseEntity.ok("User registered successfully!");
            
        } catch (Exception e) {
            System.err.println("Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: Registration failed - " + e.getMessage());
        }
    }

    // Test endpoint to check if auth is working
    @GetMapping("/test")
    public String testAuth() {
        return "Auth endpoint is working!";
    }
    
    // Health check endpoint
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
