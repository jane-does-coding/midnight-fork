<script lang="ts">
  let email = '';
  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!email.trim()) return;
    
    isSubmitting = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        successMessage = 'Thank you for your RSVP!';
        email = '';
      } else {
        errorMessage = data.error || 'Failed to submit RSVP';
      }
    } catch (error) {
      errorMessage = 'Network error. Please try again.';
      console.error('Error submitting RSVP:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="bg-[#fee1c0] min-h-screen w-full flex items-center justify-center p-4 md:p-8">
  <div class="flex flex-col items-center justify-center gap-8 md:gap-12 max-w-4xl w-full">
    <div class="relative flex items-center justify-center w-full max-w-md">
      <div class="relative w-full aspect-square max-w-[300px] md:max-w-[350px]">
        <div class="absolute inset-0 overflow-visible">
          <img 
            alt="Crow illustration" 
            class="w-full h-full object-contain" 
            src="/crow.png" 
          />
        </div>
        
      </div>
    </div>

    <h1 class="font-['PT_Serif',_serif] font-bold text-[#081832] text-3xl md:text-4xl lg:text-5xl text-center">
      a strange letter arrives...
    </h1>

    <form class="relative w-full max-w-md" on:submit={handleSubmit}>
      <div class="bg-[#081832] h-12 md:h-14 w-full flex items-center px-4 relative">
        <input 
          type="email"
          bind:value={email}
          placeholder={successMessage || "enter your email to RSVP"}
          class="bg-transparent text-[#fee1c0] placeholder-[#fee1c0] font-['PT_Sans',_sans-serif] text-lg md:text-xl w-full outline-none"
          required
          disabled={isSubmitting || !!successMessage}
        />
        <button 
          type="submit"
          class="absolute right-4 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
          disabled={isSubmitting || !!successMessage}
        >
          <img 
            alt="Submit" 
            class="w-full h-full" 
            src="/icon.svg" 
          />
        </button>
      </div>
      {#if errorMessage}
        <p class="text-red-700 font-['PT_Sans',_sans-serif] text-sm mt-2 text-center">
          {errorMessage}
        </p>
      {/if}
    </form>

    <p class="font-['PT_Sans',_sans-serif] text-[#081832] text-2xl md:text-3xl text-center mt-4 md:mt-8">
      Early 2026 in Vienna, Austria
    </p>
  </div>
</div>
