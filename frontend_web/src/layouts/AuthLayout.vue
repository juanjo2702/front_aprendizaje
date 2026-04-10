<template>
  <q-layout view="hHh lpR fFf" class="auth-layout">
    <q-page-container>
      <q-page class="auth-page flex flex-center">
        <!-- Background orbs -->
        <div class="auth-orb auth-orb--1"></div>
        <div class="auth-orb auth-orb--2"></div>

        <div class="auth-container animate-fade-in-up">
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup></script>

<style lang="scss" scoped>
.auth-layout {
  background: #0f0f23;
  min-height: 100vh;
}

.auth-page {
  position: relative;
  overflow: hidden;
}

.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.4;
  pointer-events: none;

  &--1 {
    width: 500px;
    height: 500px;
    background: #6c5ce7;
    top: -150px;
    right: -100px;
  }

  &--2 {
    width: 400px;
    height: 400px;
    background: #00d2d3;
    bottom: -150px;
    left: -100px;
  }
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 20px;
  z-index: 1;
}
</style>
