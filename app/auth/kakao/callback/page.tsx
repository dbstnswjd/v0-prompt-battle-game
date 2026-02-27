"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function KakaoCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("카카오 인증 처리 중...")

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    if (error) {
      setStatus("카카오 인증이 취소되었습니다.")
      setTimeout(() => router.push("/"), 2000)
      return
    }

    if (code) {
      setStatus("인증 완료! 메인 페이지로 이동합니다.")
      // Store the auth code if needed for future use
      try {
        sessionStorage.setItem("kakao_auth_code", code)
      } catch {
        // sessionStorage not available
      }
      setTimeout(() => router.push("/"), 1500)
    } else {
      setStatus("인증 정보를 찾을 수 없습니다.")
      setTimeout(() => router.push("/"), 2000)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12]">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-violet-200 text-lg">{status}</p>
      </div>
    </div>
  )
}
