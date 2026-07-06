<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

import { useRoute } from 'vue-router'
const route = useRoute();

const { layoutConfig, layoutState, isSidebarActive, resetMenu, closeSidebar } = useLayout();

const outsideClickListener = ref(null);
const isAnySidebarOpen = computed(() => isSidebarActive.value || !layoutState.staticMenuDesktopInactive);

watch(isAnySidebarOpen, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event) && isAnySidebarOpen.value) {
                closeSidebar();
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.menu-toggle-btn');
    const target = event.target;

    const clickedSidebar = sidebarEl && (sidebarEl.isSameNode(target) || sidebarEl.contains(target));
    const clickedTopbarButton = topbarEl && (topbarEl.isSameNode(target) || topbarEl.contains(target));

    return !clickedSidebar && !clickedTopbarButton;
}

function handleEscapeKey(event) {
    if (event.key === 'Escape' && (isSidebarActive.value || !layoutState.staticMenuDesktopInactive)) {
        closeSidebar();
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey);
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
    document.removeEventListener('keydown', handleEscapeKey);
});




</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container1">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>
<style>
    .layout-main-container1{
        margin-top: 10px;
        padding: 5px;
    }
</style>
