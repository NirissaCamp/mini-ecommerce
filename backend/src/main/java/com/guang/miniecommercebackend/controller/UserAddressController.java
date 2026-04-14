package com.guang.miniecommercebackend.controller;

import com.guang.miniecommercebackend.dto.UserAddressRequest;
import com.guang.miniecommercebackend.dto.UserAddressResponse;
import com.guang.miniecommercebackend.entity.User;
import com.guang.miniecommercebackend.entity.UserAddress;
import com.guang.miniecommercebackend.repository.UserAddressRepository;
import com.guang.miniecommercebackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
public class UserAddressController {
    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    public UserAddressController(UserAddressRepository addressRepository,
                                 UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
    }

    private UserAddressResponse toResponse(UserAddress a) {
        return new UserAddressResponse(
                a.getId(), a.getReceiverName(), a.getReceiverPhone(),
                a.getState(), a.getCity(), a.getDistrict(),
                a.getDetailAddress(), a.getIsDefault(), a.getCreatedAt());
    }

    /** GET /api/user/addresses */
    @GetMapping
    public List<UserAddressResponse> list() {
        return addressRepository.findByUserId(currentUser().getId())
                .stream().map(this::toResponse).toList();
    }

    /** POST /api/user/addresses */
    @PostMapping
    public ResponseEntity<UserAddressResponse> add(@RequestBody UserAddressRequest req) {
        User user = currentUser();

        // if new address is default, clear existing default
        if (Boolean.TRUE.equals(req.getIsDefault())) {
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setReceiverName(req.getReceiverName());
        address.setReceiverPhone(req.getReceiverPhone());
        address.setState(req.getState());
        address.setCity(req.getCity());
        address.setDistrict(req.getDistrict());
        address.setDetailAddress(req.getDetailAddress());
        address.setIsDefault(Boolean.TRUE.equals(req.getIsDefault()));

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(addressRepository.save(address)));
    }

    /** PUT /api/user/addresses/{id} */
    @PutMapping("/{id}")
    public UserAddressResponse update(@PathVariable Long id, @RequestBody UserAddressRequest req) {
        User user = currentUser();
        UserAddress address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "address not found"));

        if (Boolean.TRUE.equals(req.getIsDefault())) {
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }

        if (req.getReceiverName() != null)  address.setReceiverName(req.getReceiverName());
        if (req.getReceiverPhone() != null) address.setReceiverPhone(req.getReceiverPhone());
        if (req.getState() != null)         address.setState(req.getState());
        if (req.getCity() != null)          address.setCity(req.getCity());
        if (req.getDistrict() != null)      address.setDistrict(req.getDistrict());
        if (req.getDetailAddress() != null) address.setDetailAddress(req.getDetailAddress());
        if (req.getIsDefault() != null)     address.setIsDefault(req.getIsDefault());

        return toResponse(addressRepository.save(address));
    }

    /** DELETE /api/user/addresses/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUser();
        UserAddress address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "address not found"));
        addressRepository.delete(address);
        return ResponseEntity.noContent().build();
    }

    /** PUT /api/user/addresses/{id}/default */
    @PutMapping("/{id}/default")
    public UserAddressResponse setDefault(@PathVariable Long id) {
        User user = currentUser();
        addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });

        UserAddress address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "address not found"));
        address.setIsDefault(true);
        return toResponse(addressRepository.save(address));
    }
}
