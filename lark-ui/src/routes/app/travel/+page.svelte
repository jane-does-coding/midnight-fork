<div class="travel-page">
    <h1 class="page-title">TRAVEL</h1>

    <div class="travel-content">
        <div class="details">
            <h2 class="details-header">Visa Letter</h2>
            <p class="details-text">Need a visa letter for your travel? Fill out the form below to request one.</p>
            <div class="travel-button-wrapper">
                <a href="https://forms.hackclub.com/t/naF11efv2Nus" target="_blank" class="pushable-link">
                    <span class="front">
                        <p>Request Visa Letter</p>
                    </span>
                </a>
            </div>
        </div>

        <div class="details">
            <h2 class="details-header">School Excuse Letter</h2>
            <p class="details-text">Need an excuse letter for school? Fill out the form below to request one.</p>
            <div class="travel-button-wrapper">
                <a href="https://forms.hackclub.com/t/7yC7uKY69Mus" target="_blank" class="pushable-link">
                    <span class="front">
                        <p>Request School Excuse Letter</p>
                    </span>
                </a>
            </div>
        </div>
    </div>
</div>

<style>
.travel-page {
    position: relative;
    min-height: 100vh;
    background: #453b61;
    padding: 57px 50px 200px;
}

.travel-content {
    display: flex;
    flex-direction: row;
    gap: 64px;
}

.page-title {
    font-family: "Moga", sans-serif;
    font-size: 15vh;
    color: rgb(0, 0, 0);
    letter-spacing: -0.99px;
    margin: 0;
    line-height: 15vh;
    position: relative;
    z-index: 2;
    margin-bottom: 2vh;
}

.page-title::before {
    content: "TRAVEL";
    position: absolute;
    width: 100%;
    color: rgb(255, 255, 255);
    top: -0.75vh;
    left: 0.75vh;
    z-index: 0;
}

.details {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 35vw;
    background-color: #2D273F;
    padding: 4vh 3vw;
    border-radius: 5vh;
    position: relative;
    padding-top: 15vh;
}

.details-header {
    font-family: "Moga", sans-serif;
    font-size: 6vh;
    line-height: 5.5vh;
    font-weight: 700;
    color: rgb(0, 0, 0);
    background-color: #fee1c0;
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border-radius: 5vh;
    padding: 3vh 2vw;
    padding-top: 3.25vh;
}

.details-text {
    font-family: "PT Sans", sans-serif;
    font-size: 2.5vh;
    font-weight: 400;
    color: white;
}

.travel-link {
    display: inline-block;
    font-family: "PT Sans", sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: white;
    background: #e42d42;
    padding: 12px 24px;
    border-radius: 4px;
    text-decoration: none;
    transition: background 0.2s;
}

.travel-link:hover {
    background: #c62538;
}

/* pushable button recreated inline */
.pushable-link {
    display: inline-block;
    text-decoration: none;
    cursor: pointer;
    transform: translateY(8px) translateX(-8px);
     padding: 0;

      background-image: url('/shapes/shape-button-1.svg');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;

      rotate: -1deg;
      
}

.pushable-link .front {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: #F24B4B;
    color: white;
    font-family: "Moga", sans-serif;
    font-weight: 700;
    font-size: 4.5vh;
    padding: 1.5vh 1.5vw;
    transition: background 0.2s, transform 0.25s cubic-bezier(0.3, 0.7, 0.4, 1.5);
    transform: translateY(-6px) translateX(6px);
}

.pushable-link:hover .front,
.pushable-link:focus .front {
    background: #c62538;
    transform: translateY(-10px) translateX(10px);
}

.pushable-link:active .front {
    transform: translateY(-2px) translateX(2px);
}

.pushable-link:disabled .front {
    background: #b0b0b0;
    cursor: not-allowed;
}
</style>
