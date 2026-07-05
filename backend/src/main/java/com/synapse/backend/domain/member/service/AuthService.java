package com.synapse.backend.domain.member.service;

import com.synapse.backend.domain.member.dto.LoginRequest;
import com.synapse.backend.domain.member.dto.LoginResponse;
import com.synapse.backend.domain.member.dto.SignupRequest;
import com.synapse.backend.domain.member.entity.Member;
import com.synapse.backend.domain.member.repository.MemberRepository;
import com.synapse.backend.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public void signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        Member member = Member.create(
                request.email(),
                passwordEncoder.encode(request.password())
        );
        memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // AuthenticationManager가 자격증명 검증 (비밀번호 불일치 시 예외 발생)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        String token = jwtTokenProvider.generateToken(request.email());
        return LoginResponse.of(token);
    }
}
