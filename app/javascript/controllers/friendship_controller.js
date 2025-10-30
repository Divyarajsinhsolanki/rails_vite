import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "label", "status"]
  static values = {
    userId: Number,
    friendshipId: Number,
    following: Boolean,
    followText: { type: String, default: "Connect" },
    followingText: { type: String, default: "Following" }
  }

  connect() {
    this.updateButton()
  }

  toggle(event) {
    event.preventDefault()
    this.clearStatus()

    if (this.followingValue) {
      this.unfollow()
    } else {
      this.follow()
    }
  }

  follow() {
    this.setLoading(true)

    fetch("/friendships", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ friendship: { followed_id: this.userIdValue } })
    })
      .then(response => this.ensureOk(response))
      .then(response => response.json())
      .then(data => {
        this.friendshipIdValue = data.id
        this.followingValue = true
        this.updateButton()
      })
      .catch(error => {
        this.setStatus(error)
      })
      .finally(() => this.setLoading(false))
  }

  unfollow() {
    if (!this.hasFriendshipIdValue) {
      return
    }

    this.setLoading(true)

    fetch(`/friendships/${this.friendshipIdValue}`, {
      method: "DELETE",
      headers: this.headers()
    })
      .then(response => {
        if (response.ok || response.status === 204) {
          this.friendshipIdValue = null
          this.followingValue = false
          this.updateButton()
          return
        }

        return response
          .json()
          .catch(() => ({}))
          .then(body => {
            throw new Error(body.errors?.join(", ") || "Unable to disconnect")
          })
      })
      .catch(error => {
        this.setStatus(error)
      })
      .finally(() => this.setLoading(false))
  }

  updateButton() {
    if (this.hasLabelTarget) {
      this.labelTarget.textContent = this.followingValue
        ? this.followingTextValue
        : this.followTextValue
    }

    if (this.hasButtonTarget) {
      this.buttonTarget.classList.toggle("bg-blue-600", this.followingValue)
      this.buttonTarget.classList.toggle("text-white", this.followingValue)
      this.buttonTarget.classList.toggle("border-transparent", this.followingValue)
      this.buttonTarget.classList.toggle("border-blue-600", !this.followingValue)
      this.buttonTarget.classList.toggle("text-blue-600", !this.followingValue)
      this.buttonTarget.classList.toggle("hover:bg-blue-50", !this.followingValue)
      this.buttonTarget.classList.toggle("hover:bg-blue-600/90", this.followingValue)
    }
  }

  setLoading(state) {
    if (this.hasButtonTarget) {
      this.buttonTarget.disabled = state
      this.buttonTarget.classList.toggle("opacity-70", state)
    }
  }

  setStatus(error) {
    if (this.hasStatusTarget) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      this.statusTarget.textContent = message
    }
  }

  clearStatus() {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = ""
    }
  }

  ensureOk(response) {
    if (!response.ok) {
      return response
        .json()
        .catch(() => ({}))
        .then(body => {
          const message = body.errors?.join(", ") || "Unable to connect"
          throw new Error(message)
        })
    }

    return response
  }

  headers() {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-CSRF-Token": this.csrfToken()
    }
  }

  csrfToken() {
    const element = document.querySelector("meta[name='csrf-token']")
    return element ? element.getAttribute("content") : ""
  }
}
