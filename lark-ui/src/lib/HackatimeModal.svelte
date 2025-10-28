<script lang="ts">
    import { onMount } from "svelte";
    import { checkHackatimeAccount, getHackatimeProjects } from "./auth";
    import Button from "./Button.svelte";

    const { onClose } = $props();

    let page: number = $state(0);

    let hasHackatime: boolean = $state(false);

    function nextPage() {
        page++;
    }

    onMount(async () => {
        const data = await checkHackatimeAccount();

        if (data) {
            page = 1;

            console.log(data);

            if (data.hasHackatimeAccount) {
                hasHackatime = true;
            } else {
                hasHackatime = false;
            }
        }
    });

    let hackatimeProjects: ReturnType<typeof getHackatimeProjects> | null = null;

    $effect(() => {
        switch (page) {
            case 3:
                hackatimeProjects = getHackatimeProjects();
                break;
            case 4:
                onClose();
                break;
        }
    });

    // async function getProjects() {
    //     const projects = await getHackatimeProjects();
    // }
</script>

<svelte:head>
    <style>
        @font-face {
            font-family: "Moga";
            src: url("/font/Moga.ttf") format("truetype");
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: "PT Sans";
            src: url("/font/PTSans-Regular.ttf") format("truetype");
            font-weight: normal;
            font-style: normal;
        }
    </style>
</svelte:head>

<div class="modal-overlay">
    <div class="modal-box" onclick={(e) => e.stopPropagation()} role="none">
        {#if page == 0}
            <div class="modal-content">
                <h2 class="modal-title">LINK your account to hackatime</h2>
                <p class="modal-text">
                    checking if you already have a hackatime account...
                </p>
                <div></div>
            </div>
        {/if}
        {#if page == 1}
            <div class="modal-content">
                <h2 class="modal-title">LINK your account to hackatime</h2>
                {#if hasHackatime}
                    <p class="modal-text">
                        <span style="color: #0CC71D;"
                            >hackatime account found! ✅</span
                        > <br />
                        <i
                            >if your aunt knew what hackatime was, she’d be
                            proud!</i
                        >
                    </p>

                    <Button label="Next →" onclick={nextPage}></Button>
                {:else}
                    <p class="modal-text">
                        No account linked. Please connect your Hackatime
                        account.
                    </p>
                {/if}
            </div>
        {/if}
        {#if page == 2}
            <div class="modal-content">
                <h2 class="modal-title">Hackatime Integrity Agreement</h2>
                <div class="integrity-agreement">
                    <p>
                    Don’t cheat the time tracking system. No bots, no fake key presses, no UI manipulation. If you do, you’ll be banned from Hackatime and other participating YSWS / events / programs
                    </p><br>
                    <p>
                        <strong>By clicking "Next", you agree to the integrity agreement.</strong>
                    </p>
                </div>
                <Button label="Next →" onclick={nextPage}></Button>
            </div>
        {/if}
        {#if page == 3}
            <div class="modal-content">
                {#await getHackatimeProjects()}
                        <h2 class="modal-title">LINK your account to hackatime</h2>
                        <p class="modal-text">
                            getting hackatime projects...
                        </p>
                        <div></div>
                {:then projects}
                    {#if projects}
                        <h2 class="modal-title">Link current project to hackatime</h2>
                        <form>
                            <select>
                                {#each projects.projects as project}
                                    <option value={project.name}>{project.name}</option>
                                {/each}
                            </select>
                        </form>
                        <Button label="Next →" onclick={nextPage} />
                    {:else}
                        <p class="modal-text">
                            No projects found.
                        </p>
                        <Button label="Refresh" onclick={() => {
                            hackatimeProjects = getHackatimeProjects();
                        }} />
                    {/if}
                {/await}
            </div>
        {/if}
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-box {
        position: relative;
        background-image: url("/bg/modal-bg.svg");
        background-size: 100% 100%;
        background-repeat: no-repeat;
        width: 795px;
        height: 490px;
        max-width: 90vw;
        padding: 30px 37px;

        gap: 175px;
    }

    .modal-content {
        position: relative;
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
    }

    .modal-title {
        font-family: "Moga", sans-serif;
        font-size: 44px;
        color: #453b61;
        text-align: left;
        letter-spacing: -0.352px;
        line-height: 1.5;
    }

    .modal-text {
        font-family: "PT Sans", sans-serif;
        font-size: 24px;
        color: #453b61;
        text-align: left;
        letter-spacing: -0.264px;
        line-height: 1.5;
        margin: 0;
    }

    .integrity-agreement {
        font-family: "PT Sans", sans-serif;
        color: #453b61;
        text-align: left;
        letter-spacing: -0.264px;
        line-height: 1.5;
        margin: 0;

        width: 500px;

        padding: 16px;
        background-color: #efcfa9;
    }

    @media (max-width: 820px) {
        .modal-content {
            width: 90vw;
            height: auto;
            aspect-ratio: 795 / 490;
            padding: 25px 30px;
            gap: 120px;
        }

        .modal-title {
            font-size: 26px;
        }

        .modal-text {
            font-size: 20px;
        }
    }

    @media (max-width: 480px) {
        .modal-content {
            padding: 20px 25px;
            gap: 80px;
        }

        .modal-title {
            font-size: 20px;
        }

        .modal-text {
            font-size: 16px;
        }
    }
</style>
