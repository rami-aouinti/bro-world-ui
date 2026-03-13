import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeStub = (name: string) => defineComponent({
  name,
  props: ['label'],
  setup(props, { slots }) {
    return () => h('div', {}, [props.label as string, slots.default?.()])
  },
})

describe('RecruitApplyDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('useI18n', vi.fn(() => ({ t: (key: string) => key })))
  })

  it('rend les libellés i18n clés', async () => {
    const Component = (await import('~/app/components/platform/recruit/RecruitApplyDialog.vue')).default

    const wrapper = mount(Component, {
      props: {
        modelValue: true,
        applyForm: { firstName: '', lastName: '', email: '', coverLetter: '' },
        resumeForm: { title: '', description: '', skillTitle: '', skillDescription: '' },
        resumeMode: 'existing',
        selectedResumeId: '',
        selectedApplyJob: { id: '1', title: 'Dev' },
        applyError: '',
        applyLoading: false,
        canSubmitApplication: false,
        resumesStore: { isLoading: false, items: [] },
        selectedResume: null,
        resumeSaving: false,
        resumeDeleting: false,
      },
      global: {
        stubs: {
          'v-dialog': makeStub('v-dialog'),
          'v-card': makeStub('v-card'),
          'v-card-title': makeStub('v-card-title'),
          'v-card-text': makeStub('v-card-text'),
          'v-alert': makeStub('v-alert'),
          'v-row': makeStub('v-row'),
          'v-col': makeStub('v-col'),
          'v-text-field': makeStub('v-text-field'),
          'v-textarea': makeStub('v-textarea'),
          'v-radio-group': makeStub('v-radio-group'),
          'v-radio': makeStub('v-radio'),
          'v-select': makeStub('v-select'),
          'v-btn': makeStub('v-btn'),
          'v-card-actions': makeStub('v-card-actions'),
          'v-spacer': makeStub('v-spacer'),
          'v-file-input': makeStub('v-file-input'),
        },
      },
    })

    expect(wrapper.text()).toContain('platform.recruit.applyDialog.title')
    expect(wrapper.text()).toContain('platform.recruit.applyDialog.jobLabel')
    expect(wrapper.text()).toContain('platform.recruit.applyDialog.actions.close')
    expect(wrapper.text()).toContain('platform.recruit.applyDialog.actions.apply')
    expect(wrapper.text()).toContain('platform.recruit.applyDialog.resumeModes.existing')
  })
})
