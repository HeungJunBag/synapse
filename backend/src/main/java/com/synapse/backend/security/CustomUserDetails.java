package com.synapse.backend.security;

import com.synapse.backend.domain.member.entity.Member;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Member 엔티티를 Spring Security UserDetails로 래핑.
 * 엔티티가 Security 인터페이스에 직접 의존하지 않도록 분리.
 */
public class CustomUserDetails implements UserDetails {

    @Getter
    private final UUID memberId;
    private final String email;
    private final String password;

    public CustomUserDetails(Member member) {
        this.memberId = member.getId();
        this.email = member.getEmail();
        this.password = member.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
