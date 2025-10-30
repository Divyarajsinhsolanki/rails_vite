import { Controller } from "@hotwired/stimulus"

// Handles follow/unfollow button interactions for suggested topics.
export default class extends Controller {
  static values = {
    followUrl: String,
    following: Boolean
  }

  static targets = ["button", "count"]

  connect() {
    this.updateButton()
  }

  toggle(event) {
    event.preventDefault()
    this.followingValue ? this.unfollow() : this.follow()
  }

  follow() {
    this.request("POST")
  }

  unfollow() {
    this.request("DELETE")
  }

  request(method) {
    const headers = { ...this.headers }
    if (method === "POST") {
      headers["Content-Type"] = "application/json"
    }

    fetch(this.followUrlValue, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify({}) : null
    })
      .then((response) => {
        if (!response.ok) throw response
        return response.json()
      })
      .then((payload) => {
        this.followingValue = payload.followed
        this.updateButton()
        if (this.hasCountTarget) {
          this.countTarget.textContent = this.formatFollowers(payload.follows_count)
        }
      })
      .catch(async (error) => {
        let message = "Something went wrong"
        try {
          const data = await error.json()
          if (data.error) message = data.error
        } catch (_) {
          // Ignore JSON parsing errors.
        }
        this.notify(message)
      })
  }

  updateButton() {
    if (!this.hasButtonTarget) return

    this.buttonTarget.classList.toggle("topic-chip__button--following", this.followingValue)
    this.buttonTarget.querySelector(".topic-chip__button-text").textContent = this.followingValue ? "Following" : "Follow"
    this.buttonTarget.setAttribute("aria-pressed", this.followingValue)
  }

  formatFollowers(count) {
    if (!count || count === 0) return "No followers yet"
    return count === 1 ? "1 follower" : `${count} followers`
  }

  notify(message) {
    if (window?.Toastify) {
      window.Toastify({ text: message, duration: 3000, gravity: "bottom", position: "right", className: "toast-error" }).showToast()
    } else {
      // Fallback alert for when Toastify or other notification helpers are unavailable.
      window.alert(message)
    }
  }

  get headers() {
    const token = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
    return {
      "Accept": "application/json",
      "X-CSRF-Token": token
    }
  }
}
