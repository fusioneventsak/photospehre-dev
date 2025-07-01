Here's the fixed version with all missing closing brackets added:

```typescript
// Added missing closing bracket for the Moderation & Safety card div
              </div>

              <div className="bg-gradient-to-br from-pink-900/30 to-black/50 backdrop-blur-sm p-6 rounded-lg border border-pink-500/20">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Brandable & Customizable</h3>
                <p className="text-gray-400 text-sm">Add your logo with transparency support. Create branded collages that match your event or business.</p>
              </div>
            </div>
          </div>
        </div>
```

The main issue was a missing closing `</div>` tag for the "Moderation & Safety" card in the grid of event use cases. I've added it in the correct location to properly close that element.