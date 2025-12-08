<script lang="ts">
    import type { ShopItemVariant } from "$lib/auth";

    const { itemId, name, img, desc, requiredHours, isActive = true, variants = [] }: {
        itemId: number;
        name: string;
        desc: string;
        img: string;
        requiredHours: number | null;
        isActive?: boolean;
        variants?: ShopItemVariant[];
    } = $props();

    const hasVariants = variants.length > 0;
    const minVariantCost = hasVariants ? Math.min(...variants.map(v => v.cost)) : null;
    const maxVariantCost = hasVariants ? Math.max(...variants.map(v => v.cost)) : null;

    function getDisplayPrice(): string {
        if (hasVariants && minVariantCost !== null && maxVariantCost !== null) {
            if (minVariantCost === maxVariantCost) {
                return `${minVariantCost} hours`;
            }
            return `${minVariantCost} - ${maxVariantCost} hours`;
        }
        if (requiredHours) {
            return `${requiredHours} hours needed`;
        }
        return 'Free';
    }
</script>

<a
    href={isActive ? `/app/shop/${itemId}` : undefined}
    class="group rounded-[2vh] gap-[1vh] flex flex-col s-center text-center transition-all no-select {isActive ? 'cursor-pointer' : 'cursor-not-allowed'}"
    onclick={(e) => !isActive && e.preventDefault()}
>
    <div
        class="bg-[#5E5087] p-[2vh] border border-black rounded-[2vh] shadow-lg transition-all duration-200 ease-out {isActive ? 'group-hover:rotate-[2deg] group-hover:shadow-2xl group-hover:scale-[1.1]' : 'opacity-50 grayscale'}"
    >
        {#if img}
            <img
                src={img}
                alt={name}
                class="rounded-[1.5vh] mb-[1vh] w-full h-[25vh] object-cover border-2 border-black transition-all duration-200 ease-out no-select"
                draggable="false"
            />
        {:else}
            <div class="rounded-[1.5vh] mb-[1vh] w-full h-[25vh] bg-[#453b61] border-2 border-black flex items-center justify-center">
                <span class="text-4xl">🛍️</span>
            </div>
        {/if}
        <div class="flex flex-col s-center justify-center no-select gap-1">
            <p>{getDisplayPrice()}</p>
            {#if hasVariants}
                <p class="text-blue-300 text-sm">{variants.length} option{variants.length > 1 ? 's' : ''}</p>
            {/if}
            {#if !isActive}
                <p class="text-red-400 text-sm">Unavailable</p>
            {/if}
        </div>
    </div>

    <div
        class="bg-[#5E5087] px-[0] py-[1vh] w-full border border-black rounded-[2vh] shadow-lg transition-all duration-200 ease-out {isActive ? 'group-hover:-rotate-[3deg] group-hover:shadow-2xl group-hover:scale-[1.05]' : 'opacity-50 grayscale'}"
    >
        <h3 class="text-[3vh] font-bold font-['PT_Serif',_serif] border-b border-black pb-[0.5vh] px-[1vw] line-clamp-2 overflow-hidden text-ellipsis break-words">
            {name}
        </h3>
        <p class="text-[2vh] opacity-80 pt-[0.5vh] px-[1vw] line-clamp-2 overflow-hidden text-ellipsis">{desc}</p>
    </div>
</a>
