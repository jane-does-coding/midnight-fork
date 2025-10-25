<script lang="ts">
    import { goto } from '$app/navigation';
  import { checkAuthStatus } from '$lib/auth';
  import Dialogue from '$lib/Dialogue.svelte';
  import { onMount } from 'svelte';
  
  let step = $state(-1);
  let missingInfo = $state(false);

  let dialogueText = $state('');

  function nextStep() {
    step++;

    switch (step) {
        case 0:
          dialogueText = 'Greetings. I\'m Murdock. Your aunt\'s butler. She demanded I guide you through this process.';
          break;
        case 1:
          dialogueText = 'I\'m sorry, but I can\'t help you with that.';
          break;
    }
  }

  onMount(async () => {
    const authStatus = await checkAuthStatus();

    if (!authStatus) {
      goto('/');
      return;
    } else if (authStatus.onboardComplete) {
      goto('/app/home');
      return;
    }

    if (!authStatus.name || !authStatus.email || !authStatus.birthday) {
      missingInfo = true;
      return;
    }

    nextStep();
  });
</script>

<svelte:head>
  <style>
    @font-face {
      font-family: 'PT Sans';
      src: url('/font/PTSans-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'PT Sans';
      src: url('/font/PTSans-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
  </style>
</svelte:head>

<div class="onboarding-page">
  <Dialogue
    speaker="MURDOCK"
    text={dialogueText}
    nextFn={nextStep}
  />
</div>

<style>
  .onboarding-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: #453b61;
    overflow: hidden;
  }
</style>
