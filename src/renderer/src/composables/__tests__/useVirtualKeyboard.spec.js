import { describe, it, expect, beforeEach } from 'vitest'
import { useVirtualKeyboard } from '@/composables/useVirtualKeyboard.js'

describe('useVirtualKeyboard', () => {
  let keyboard

  beforeEach(() => {
    keyboard = useVirtualKeyboard()
  })

  it('starts hidden', () => {
    expect(keyboard.visible.value).toBe(false)
  })

  it('starts with text keys', () => {
    expect(keyboard.keys.value).toContain('Q')
    expect(keyboard.keys.value).toContain('A')
    expect(keyboard.keys.value).toContain('Z')
    expect(keyboard.keys.value).toContain(' ')
  })

  it('showKeyboard sets text keys for text type', () => {
    const input = { value: '' }
    keyboard.showKeyboard(input, 'text')
    expect(keyboard.visible.value).toBe(true)
    expect(keyboard.keys.value.length).toBeGreaterThan(10)
    expect(keyboard.keys.value).toContain('Q')
    expect(keyboard.keys.value).not.toContain('1')
  })

  it('showKeyboard sets number keys for number type', () => {
    const input = { value: '' }
    keyboard.showKeyboard(input, 'number')
    expect(keyboard.visible.value).toBe(true)
    expect(keyboard.keys.value).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
  })

  it('pressKey adds character to input', () => {
    const input = { value: '' }
    keyboard.showKeyboard(input, 'text')
    keyboard.pressKey('A')
    expect(input.value).toBe('A')
    keyboard.pressKey('B')
    expect(input.value).toBe('AB')
  })

  it('pressKey BACKSPACE removes last character', () => {
    const input = { value: 'ABC' }
    keyboard.showKeyboard(input, 'text')
    keyboard.pressKey('BACKSPACE')
    expect(input.value).toBe('AB')
  })

  it('pressKey BACKSPACE handles empty input', () => {
    const input = { value: '' }
    keyboard.showKeyboard(input, 'text')
    keyboard.pressKey('BACKSPACE')
    expect(input.value).toBe('')
  })

  it('pressKey ENTER blurs and hides', () => {
    let blurred = false
    const input = {
      value: 'test',
      blur: () => {
        blurred = true
      }
    }
    keyboard.showKeyboard(input, 'text')
    keyboard.pressKey('ENTER')
    expect(blurred).toBe(true)
    expect(keyboard.visible.value).toBe(false)
  })

  it('pressKey does nothing when no input', () => {
    keyboard.pressKey('A')
    expect(keyboard.visible.value).toBe(false)
  })

  it('hideKeyboard hides', () => {
    const input = { value: '' }
    keyboard.showKeyboard(input, 'text')
    expect(keyboard.visible.value).toBe(true)
    keyboard.hideKeyboard()
    expect(keyboard.visible.value).toBe(false)
  })

  it('showKeyboard replaces existing input ref', () => {
    const input1 = { value: '' }
    const input2 = { value: '' }
    keyboard.showKeyboard(input1, 'text')
    keyboard.showKeyboard(input2, 'number')
    keyboard.pressKey('5')
    expect(input1.value).toBe('')
    expect(input2.value).toBe('5')
  })
})
