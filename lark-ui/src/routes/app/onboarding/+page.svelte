<script lang="ts">
    import { goto } from '$app/navigation';
  import { checkAuthStatus } from '$lib/auth';
  import Dialogue from '$lib/Dialogue.svelte';
    import Texture from '$lib/Texture.svelte';
  import { onMount } from 'svelte';
  
  const dialogues = [
    'Greetings. I\'m Murdock. Your aunt\'s butler. She demanded I guide you through this process.',
    'Obviously, I told her you’re not an idiot. Yet, here we are. ',
    'First... Sign up.',
    '',
    'To earn your invite to Vienna, you must prove your skills. Code for 40 hours. Code additional hours to get your travel fully covered.',
    'Code additional hours to get your travel fully covered.  Enter your location ... And see how much a fully funded flight demands.',
    'Hmm... [#hours] You can create as many projects as you want to hit this goal.',
    'Now... Let’s get started.',
    'Build a personal website, platformer game, or anything you want. Here’s a holographic sticker for your efforts.'
  ]


  let step = $state(0);
  let missingInfo = $state(false);

  let dialogueText = $state(dialogues[0]);
  let visible = $state(true);
  let formVisible = $state(false);
  
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let birthday = $state('');
  
  async function handleSubmit() {
    // Submit form data
    console.log({ firstName, lastName, email, birthday });
    missingInfo = false;
    nextStep();
  }

  function nextStep() {
    step++;

    if (step == 1 && !missingInfo) {
      step = 4;
    } else {
      formVisible = true;
    }

    if (step == 3) {
      visible = false;
    }

    if (step == 4) {
      formVisible = false;
    }

    if (step >= dialogues.length) {
      visible = false;
      return;
    }

    dialogueText = dialogues[step];
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

    console.log(authStatus);

    firstName = authStatus.firstName;
    lastName = authStatus.lastName;
    email = authStatus.email;
    birthday = authStatus.birthday;

    if (authStatus.firstName == 'Temporary' || authStatus.lastName == 'User' || !authStatus.email || !authStatus.birthday) {
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
  <!-- <Texture /> -->

  {#if formVisible}
    <div class="form-container">
      <form class="signup-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-background"></div>
        
        <div class="form-content">
          <h1 class="form-title">SIGN UP FOR MIDNIGHT</h1>
          <p class="form-subtitle">For ages 13 to 18</p>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                bind:value={firstName}
                placeholder="William"
                required
              />
            </div>
            
            <div class="form-field">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                bind:value={lastName}
                placeholder="Daniel"
                required
              />
            </div>
            
            <div class="form-field">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                bind:value={email}
                placeholder="wdaniel@hackclub.com"
                required
              />
            </div>
            
            <div class="form-field">
              <label for="birthday">Birthday</label>
              <input 
                type="text" 
                id="birthday" 
                bind:value={birthday}
                placeholder="mm/dd/yyyy"
                required
              />
            </div>
          </div>
          
          <button type="submit" class="submit-button">
            <span>SUBMIT</span>
            <img src="/quill-icon.svg" alt="" class="quill-icon" />
          </button>
        </div>
      </form>
    </div>
  {/if}

  <Dialogue
    speaker="MURDOCK"
    text={dialogueText}
    nextFn={nextStep}
    visible={visible}
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

  .form-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 866px;
    max-width: 90%;
  }

  .signup-form {
    position: relative;
    width: 100%;
    padding: 84px 28px 40px;
  }

  .form-background {
    position: absolute;
    inset: 0;
    background: white;
    border-radius: 10px;
    overflow: hidden;
  }

  .form-background::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/form-texture.png');
    background-size: cover;
    background-position: center;
    opacity: 0.5;
  }

  .form-content {
    position: relative;
    z-index: 1;
  }

  .form-title {
    font-family: 'Moga', sans-serif;
    font-size: 80px;
    color: #453b61;
    text-align: center;
    letter-spacing: -0.88px;
    margin: 0 0 10px 0;
    line-height: 1.5;
  }

  .form-subtitle {
    font-family: 'PT Sans', sans-serif;
    font-size: 24px;
    color: rgba(0, 0, 0, 0.7);
    text-align: center;
    margin: 0 0 40px 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px 20px;
    margin-bottom: 36px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .form-field label {
    font-family: 'PT Sans', sans-serif;
    font-weight: bold;
    font-size: 24px;
    color: black;
  }

  .form-field input {
    background: #fffbf6;
    border: none;
    height: 48px;
    padding: 0 11px;
    font-family: 'PT Sans', sans-serif;
    font-size: 20px;
    color: rgba(0, 0, 0, 0.7);
  }

  .form-field input::placeholder {
    color: rgba(0, 0, 0, 0.7);
  }

  .submit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 300px;
    height: 89px;
    background: #f24b4b;
    border: none;
    border-radius: 16px;
    margin: 0 auto;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .submit-button:hover {
    opacity: 0.9;
  }

  .submit-button span {
    font-family: 'Moga', sans-serif;
    font-size: 64px;
    color: #fee1c0;
    letter-spacing: 3.84px;
    line-height: 1;
  }

  .quill-icon {
    width: 31px;
    height: 46px;
    margin-top: 8px;
  }

  @media (max-width: 900px) {
    .form-container {
      width: 95%;
    }

    .form-title {
      font-size: 48px;
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  @media (max-width: 600px) {
    .form-title {
      font-size: 36px;
    }

    .form-subtitle {
      font-size: 18px;
    }

    .form-field label {
      font-size: 18px;
    }

    .form-field input {
      font-size: 16px;
      height: 40px;
    }

    .submit-button {
      width: 240px;
      height: 70px;
    }

    .submit-button span {
      font-size: 48px;
    }

    .quill-icon {
      width: 24px;
      height: 36px;
    }
  }
</style>
