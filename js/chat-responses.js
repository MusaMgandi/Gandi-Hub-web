export const WELCOME_MESSAGE = {
    text: `👋 Hi there! I'm your AI Sports & Academic Assistant! 🎓🏉

I'm here to help you excel in both sports and studies! I can assist with:

📚 Academic Support:
• Study strategies and planning
• Time management techniques
• Exam preparation tips

🏃‍♂️ Sports Development:
• Training advice and schedules
• Pre-game preparation
• Recovery techniques

🧘‍♂️ Wellness & Balance:
• Stress management
• Nutrition guidance
• Mental preparation

How can I support your journey today? 🌟`,
    type: 'ai'
};

export const responseEnhancers = {
    addEmoji(topic) {
        const emojis = {
            study: ['📚', '✏️', '🎓'],
            training: ['🏃‍♂️', '💪', '🏋️‍♂️'],
            nutrition: ['🥗', '🥩', '🥑'],
            mental: ['🧠', '🎯', '🧘‍♂️'],
            success: ['🌟', '🏆', '✨'],
            time: ['⏰', '📅', '⌚'],
            support: ['👍', '🤝', '💪'],
            greeting: ['👋', '😊', '🌟'],
            recovery: ['💆‍♂️', '🏋️‍♂️', '🧘‍♂️'],
            competition: ['🏆', '🏈', '🏊‍♂️'],
            question: ['❓', '🤔', '🔍'],
            help: ['🆘', '🛟', '🤲'],
            feedback: ['📝', '📊', '🔄']
        };
        return emojis[topic] || ['✨'];
    },

    addGreeting() {
        const currentHour = new Date().getHours();
        let timeBasedGreeting;
        
        if (currentHour < 12) {
            timeBasedGreeting = "Good morning! ";
        } else if (currentHour < 18) {
            timeBasedGreeting = "Good afternoon! ";
        } else {
            timeBasedGreeting = "Good evening! ";
        }
        
        const greetings = [
            `${timeBasedGreeting}👋 `,
            `Hello there! ${this.addEmoji('greeting')[Math.floor(Math.random() * 3)]} `,
            `Hey! How's your day going? `,
            `Hi! I'm excited to chat with you today! `,
            `Welcome back! Ready to achieve your goals? `
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    },

    getContextualGreeting(topic) {
        const contextualGreetings = {
            study: [
                "📚 Let's boost your academic performance! ",
                "🎓 Ready to tackle your studies with some proven strategies! ",
                "✏️ Great focus on academics! What specific area can I help with? "
            ],
            training: [
                "💪 Let's enhance your rugby skills with some targeted exercises! ",
                "🏃‍♂️ Time to level up your game! What aspect are you focusing on? ",
                "🏉 Ready for some rugby excellence! I've got some great drills in mind. "
            ],
            nutrition: [
                "🥗 Let's fuel your performance with optimal nutrition! ",
                "🥩 Ready to optimize your diet for peak athletic performance? ",
                "🍎 Great focus on fueling your body! What's your current nutrition goal? "
            ],
            mental: [
                "🧠 Let's build that champion mindset for both sports and academics! ",
                "🎯 Ready to strengthen your mental game with proven techniques? ",
                "🧘‍♂️ Mental excellence is key to success! What specific challenge are you facing? "
            ],
            greeting: [
                "It's great to see you! How can I support your journey today? ",
                "Welcome to Gandi-Hub! I'm here to help with both academics and sports. ",
                "Hello! I'm your AI assistant for all things sports and academics. What's on your mind? "
            ],
            question: [
                "I'd be happy to answer that for you! ",
                "Great question! Let me provide some insights. ",
                "I'm here to help with questions just like that! "
            ]
        };
        return (contextualGreetings[topic] || ["Let's work together on achieving your goals! "])[Math.floor(Math.random() * 3)];
    },

    analyzeQuery(message) {
        const lowerMessage = message.toLowerCase().trim();
        
        console.log(`Analyzing message: "${lowerMessage}"`);
        
        // Enhanced greeting detection with more variations
        const greetings = [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 
            'hi there', 'howdy', 'what\'s up', 'how are you', 'how\'s it going', 
            'greetings', 'sup', 'yo', 'hiya', 'helo', 'hii', 'goodmorning', 'goodevening',
            'goodafternoon', 'morning', 'evening', 'afternoon'
        ];
        
        // Direct exact matches for simple greetings
        if (greetings.includes(lowerMessage) || 
            greetings.some(g => lowerMessage === g + '!' || lowerMessage === g + '?' || lowerMessage === g + '.')) {
            
            console.log('Detected simple greeting');
            return { 
                topic: 'greeting', 
                intent: 'simple_greet',
                isSimpleGreeting: true,
                greetingType: this.identifyGreetingType(lowerMessage)
            };
        }
        
        // Check for greetings that might have additional content
        if (greetings.some(g => lowerMessage.startsWith(g + ' ') || 
                               lowerMessage.startsWith(g + '! ') || 
                               lowerMessage.startsWith(g + '? ') || 
                               lowerMessage.startsWith(g + '. '))) {
            
            console.log('Detected greeting with additional content');
            return { 
                topic: 'greeting', 
                intent: 'greet_with_content',
                isSimpleGreeting: false,
                greetingType: this.identifyGreetingType(lowerMessage)
            };
        }

        // Enhanced topic detection
        const topics = {
            training: ['training', 'workout', 'exercise', 'practice', 'drill', 'fitness', 'strength', 'conditioning', 'gym', 'cardio', 'endurance', 'agility', 'speed', 'power', 'technique'],
            nutrition: ['food', 'diet', 'nutrition', 'eat', 'meal', 'protein', 'carbs', 'hydration', 'calories', 'supplement', 'vitamin', 'macro', 'nutrient', 'fuel', 'energy'],
            mental: ['stress', 'anxiety', 'focus', 'mental', 'mindset', 'psychology', 'motivation', 'confidence', 'concentration', 'visualization', 'pressure', 'nerves', 'fear', 'doubt', 'resilience'],
            study: ['study', 'exam', 'test', 'homework', 'assignment', 'academic', 'class', 'course', 'grade', 'lecture', 'note', 'learn', 'understand', 'comprehend', 'remember', 'memorize'],
            recovery: ['recovery', 'rest', 'sleep', 'injury', 'pain', 'soreness', 'stretching', 'flexibility', 'rehabilitation', 'ice', 'heat', 'massage', 'foam roll', 'relax', 'rejuvenate'],
            competition: ['game', 'match', 'competition', 'tournament', 'performance', 'play', 'compete', 'opponent', 'strategy', 'tactic', 'win', 'lose', 'score', 'point', 'team'],
            time: ['schedule', 'time', 'planning', 'balance', 'organize', 'routine', 'calendar', 'priority', 'deadline', 'efficient', 'productivity', 'procrastination', 'focus', 'distraction']
        };

        // Enhanced question types detection
        const questionTypes = {
            what: /^what\b|^tell me what\b|^explain what\b/i,
            how: /^how\b|^tell me how\b|^explain how\b/i,
            why: /^why\b|^tell me why\b|^explain why\b/i,
            when: /^when\b|^tell me when\b/i,
            where: /^where\b|^tell me where\b/i,
            who: /^who\b|^tell me who\b/i,
            which: /^which\b|^tell me which\b/i,
            can: /^can\b|^could\b/i,
            should: /^should\b|^would\b|^is it good to\b/i,
            comparison: /\bvs\b|\bversus\b|\bcompared to\b|\bbetter than\b|\bworse than\b/i,
            recommendation: /\brecommend\b|\bsuggest\b|\badvise\b|\bbest\b/i
        };
        
        // Determine question type
        let questionType = 'general';
        for (const [type, pattern] of Object.entries(questionTypes)) {
            if (pattern.test(lowerMessage)) {
                questionType = type;
                break;
            }
        }
        
        const isQuestion = Object.values(questionTypes).some(pattern => pattern.test(lowerMessage)) || message.includes('?');
        const isRequest = /^(help|show|give|tell|suggest|recommend|advise|need|assist|guide|support)\b/.test(lowerMessage);
        
        // Detect urgency words
        const urgencyWords = ['urgent', 'asap', 'emergency', 'immediately', 'right now', 'today', 'soon', 'quickly', 'hurry'];
        const isUrgent = urgencyWords.some(word => lowerMessage.includes(word));

        // Find matching topics
        const matchedTopics = Object.entries(topics).filter(([topic, keywords]) => 
            keywords.some(keyword => lowerMessage.includes(keyword))
        );

        // Detect personal context
        const personalContext = {
            isStruggling: /\b(struggling|hard time|difficulty|problem|trouble|can't|cannot|stuck)\b/i.test(lowerMessage),
            isImproving: /\b(improve|better|enhance|increase|boost|optimize|maximize)\b/i.test(lowerMessage),
            isBeginning: /\b(begin|start|new|novice|beginner|first time|learning)\b/i.test(lowerMessage),
            isAdvanced: /\b(advanced|experienced|expert|professional|elite|high level)\b/i.test(lowerMessage),
            needsMotivation: /\b(motivation|inspire|encourage|push|drive|lazy|procrastinate)\b/i.test(lowerMessage)
        };

        const context = {
            topic: matchedTopics.length > 0 ? matchedTopics[0][0] : (isQuestion ? 'question' : ''),
            subtopics: matchedTopics.map(([topic]) => topic),
            isQuestion,
            questionType: isQuestion ? questionType : '',
            isRequest,
            isUrgent,
            personalContext,
            tone: this.analyzeTone(message)
        };

        return context;
    },

    analyzeTone(message) {
        const tonePatterns = {
            frustrated: ['frustrated', 'annoyed', 'tired of', 'sick of', 'struggling', 'fed up', 'irritated', 'bothered', 'upset', 'angry'],
            excited: ['excited', 'looking forward', 'cant wait', 'amazing', 'awesome', 'great', 'excellent', 'fantastic', 'wonderful', 'thrilled'],
            worried: ['worried', 'concerned', 'nervous', 'anxious', 'scared', 'afraid', 'fear', 'stress', 'panic', 'dread'],
            confused: ['confused', 'dont understand', 'unclear', 'lost', 'help', 'puzzled', 'perplexed', 'bewildered', 'unsure', 'complicated'],
            determined: ['determined', 'committed', 'going to', 'will', 'must', 'need to', 'have to', 'goal', 'plan', 'achieve'],
            curious: ['curious', 'wonder', 'interested', 'tell me about', 'want to know', 'learn about', 'discover', 'find out', 'explain'],
            grateful: ['thanks', 'thank you', 'appreciate', 'grateful', 'helpful', 'helped', 'good job', 'well done']
        };

        for (const [tone, patterns] of Object.entries(tonePatterns)) {
            if (patterns.some(pattern => message.toLowerCase().includes(pattern))) {
                return tone;
            }
        }
        return 'neutral';
    },

    identifyGreetingType(message) {
        const lowerMessage = message.toLowerCase();
        
        console.log(`Identifying greeting type for: "${lowerMessage}"`);
        
        // Time-based greetings
        if (lowerMessage.includes('morning') || lowerMessage.includes('goodmorning')) {
            console.log('Identified as morning greeting');
            return 'morning';
        } else if (lowerMessage.includes('afternoon') || lowerMessage.includes('goodafternoon')) {
            console.log('Identified as afternoon greeting');
            return 'afternoon';
        } else if (lowerMessage.includes('evening') || lowerMessage.includes('goodevening') || lowerMessage.includes('night')) {
            console.log('Identified as evening greeting');
            return 'evening';
        }
        
        // General greetings
        if (lowerMessage.includes('hey') || lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('helo') || lowerMessage.includes('hii')) {
            console.log('Identified as casual greeting');
            return 'casual';
        }
        
        // Inquiry greetings
        if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'s it going') || lowerMessage.includes('what\'s up')) {
            console.log('Identified as inquiry greeting');
            return 'inquiry';
        }
        
        console.log('Defaulting to general greeting');
        return 'general';
    },

    enhanceResponse(userMessage, baseResponse) {
        const context = this.analyzeQuery(userMessage);
        let enhancedResponse = '';

        console.log('Context for response:', context);

        // Handle simple greetings specially
        if (context.topic === 'greeting' && context.isSimpleGreeting) {
            console.log('Generating greeting response for type:', context.greetingType);
            const timeEmoji = this.getTimeBasedEmoji();
            const currentHour = new Date().getHours();
            
            // Create more engaging and varied greeting responses
            if (context.greetingType === 'morning') {
                const morningGreetings = [
                    `Good morning! ${timeEmoji} Hope you're ready for a productive day! How can I help with your sports and academic goals today?`,
                    `Morning! ${timeEmoji} It's a great time to plan your day. What would you like to focus on today?`,
                    `Rise and shine! ${timeEmoji} The early athlete gets the win! How can I support your morning routine today?`,
                    `Good morning! ${timeEmoji} Starting the day with some planning? I'm here to help with whatever you need.`
                ];
                return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
            } 
            else if (context.greetingType === 'afternoon') {
                const afternoonGreetings = [
                    `Good afternoon! ${timeEmoji} How's your day going? Need any help with training plans or study strategies?`,
                    `Afternoon! ${timeEmoji} Hope you're having a productive day. What can I help you with right now?`,
                    `Good afternoon! ${timeEmoji} This is a great time to check in on your goals. How's your progress today?`,
                    `Hi there! ${timeEmoji} Afternoon is perfect for refocusing. What would you like to work on?`
                ];
                return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
            } 
            else if (context.greetingType === 'evening') {
                const eveningGreetings = [
                    `Good evening! ${timeEmoji} Winding down or just getting started? How can I assist you tonight?`,
                    `Evening! ${timeEmoji} Great time to reflect on the day or plan for tomorrow. What's on your mind?`,
                    `Good evening! ${timeEmoji} How was your day? Need help with recovery strategies or study plans?`,
                    `Hi there! ${timeEmoji} Evening is perfect for review and recovery. How can I support you tonight?`
                ];
                return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
            }
            else if (context.greetingType === 'inquiry') {
                const inquiryResponses = [
                    `I'm doing great, thanks for asking! ${this.addEmoji('greeting')[0]} I'm ready to help with your sports and academic needs. What can I assist you with today?`,
                    `I'm excellent and ready to help! ${this.addEmoji('greeting')[0]} How about you? What brings you here today?`,
                    `Thanks for asking! I'm always at my best when helping you achieve your goals. ${this.addEmoji('greeting')[0]} What would you like to work on today?`,
                    `I'm doing well and ready to assist! ${this.addEmoji('greeting')[0]} How's your training and academic progress going?`
                ];
                return inquiryResponses[Math.floor(Math.random() * inquiryResponses.length)];
            }
            else {
                // For casual or general greetings, use time of day to determine appropriate response
                console.log('Using time-based casual greeting, current hour:', currentHour);
                if (currentHour < 12) {
                    const casualMorningGreetings = [
                        `Hey there! ${timeEmoji} Good morning! Ready to tackle today's goals? How can I help you?`,
                        `Hi! ${timeEmoji} Morning's a great time for planning. What would you like to focus on today?`,
                        `Hello! ${timeEmoji} Hope your morning is going well. What can I help you with today?`,
                        `Hey! ${timeEmoji} Starting the day with some planning? I'm here to help with whatever you need.`
                    ];
                    return casualMorningGreetings[Math.floor(Math.random() * casualMorningGreetings.length)];
                } else if (currentHour < 18) {
                    const casualAfternoonGreetings = [
                        `Hey there! ${timeEmoji} Hope your afternoon is going well. What can I help you with today?`,
                        `Hi! ${timeEmoji} Good afternoon! Need any assistance with your training or studies?`,
                        `Hello! ${timeEmoji} Afternoon check-in? I'm here to help with your sports and academic goals.`,
                        `Hey! ${timeEmoji} How's your day going? I'm ready to assist with whatever you need.`
                    ];
                    return casualAfternoonGreetings[Math.floor(Math.random() * casualAfternoonGreetings.length)];
                } else {
                    const casualEveningGreetings = [
                        `Hey there! ${timeEmoji} Good evening! How can I help you tonight?`,
                        `Hi! ${timeEmoji} Evening's a great time for reflection. What's on your mind?`,
                        `Hello! ${timeEmoji} Hope you had a productive day. What can I help you with tonight?`,
                        `Hey! ${timeEmoji} Winding down or gearing up? I'm here to assist with your goals.`
                    ];
                    return casualEveningGreetings[Math.floor(Math.random() * casualEveningGreetings.length)];
                }
            }
        }

        // Add appropriate greeting based on tone
        if (context.tone === 'frustrated') {
            enhancedResponse = "I understand your frustration. Let's work through this together. ";
        } else if (context.tone === 'worried') {
            enhancedResponse = "I hear your concerns. Don't worry, I'm here to help you navigate this. ";
        } else if (context.tone === 'confused') {
            enhancedResponse = "Let me help clarify things for you. I'll break this down step by step. ";
        } else if (context.tone === 'excited') {
            enhancedResponse = "That's the spirit! I'm excited to help you achieve your goals. ";
        } else if (context.tone === 'determined') {
            enhancedResponse = "I love your determination! Let's make a solid plan to help you succeed. ";
        } else if (context.tone === 'curious') {
            enhancedResponse = "Great question! I'm happy to share some insights about that. ";
        } else if (context.tone === 'grateful') {
            enhancedResponse = "You're very welcome! I'm glad I could help. ";
        } else if (context.isQuestion) {
            enhancedResponse = this.getContextualGreeting('question');
        } else {
            enhancedResponse = '';
        }

        // Add personalized context if detected
        if (context.personalContext) {
            if (context.personalContext.isStruggling) {
                enhancedResponse += "Many athletes face similar challenges. ";
            } else if (context.personalContext.isBeginning) {
                enhancedResponse += "Starting something new is always exciting! ";
            } else if (context.personalContext.isAdvanced) {
                enhancedResponse += "For someone at your level, let me provide some advanced insights. ";
            } else if (context.personalContext.needsMotivation) {
                enhancedResponse += "Let me help you find that spark to keep pushing forward. ";
            }
        }

        // Add the base response
        enhancedResponse += baseResponse;

        // Add question-specific follow-ups
        if (context.isQuestion) {
            if (context.questionType === 'how') {
                enhancedResponse += "\n\nWould you like me to break down these steps in more detail?";
            } else if (context.questionType === 'what') {
                enhancedResponse += "\n\nIs there a specific aspect of this you'd like me to elaborate on?";
            } else if (context.questionType === 'recommendation') {
                enhancedResponse += "\n\nWould you like more personalized recommendations based on your specific situation?";
            } else if (context.questionType === 'comparison') {
                enhancedResponse += "\n\nDoes this comparison help with your decision? I can provide more specific details if needed.";
            } else {
                enhancedResponse += "\n\nDoes this answer your question? Feel free to ask for more details!";
            }
        } else if (context.isRequest) {
            enhancedResponse += "\n\nWould you like more specific suggestions tailored to your situation?";
        }

        // Add relevant emojis
        const emoji = this.addEmoji(context.topic)[0];
        if (emoji) {
            enhancedResponse = `${emoji} ${enhancedResponse}`;
        }

        return enhancedResponse;
    },

    getTimeBasedEmoji() {
        const currentHour = new Date().getHours();
        if (currentHour < 6) return '🌙'; // Night
        if (currentHour < 12) return '☀️'; // Morning
        if (currentHour < 18) return '🌤️'; // Afternoon
        if (currentHour < 22) return '🌆'; // Evening
        return '🌙'; // Night
    },

    getRugbyExample(topic) {
        const examples = {
            positions: '• Position-specific drills for your role\n• Key responsibilities and positioning\n• Performance indicators to track your progress',
            skills: '• Progressive skill development exercises\n• Common technique corrections and fixes\n• Targeted practice drills for rapid improvement',
            fitness: '• Rugby-specific conditioning tailored to your position\n• Position-based fitness focus areas\n• Game simulation drills for match fitness',
            mental: '• Pre-game visualization techniques\n• Focus and concentration drills\n• Pressure situation training scenarios'
        };
        return examples[topic] || '';
    },

    getQuickSteps(topic) {
        const steps = {
            study: '1. Quick review of key concepts\n2. Focus on challenging areas\n3. Practice with timed questions\n4. Teach concepts to reinforce learning\n5. Regular short breaks to maintain focus',
            training: '1. Dynamic warm-up routine\n2. Skill-specific drills\n3. Game situation practice\n4. Conditioning finisher\n5. Proper cool down and recovery',
            mental: '1. 5-minute mindfulness breathing\n2. Visualization of successful performance\n3. Positive self-talk practice\n4. Focus drill with distractions\n5. Performance reflection journal',
            nutrition: '1. Assess current eating patterns\n2. Identify key improvement areas\n3. Create simple meal templates\n4. Implement hydration strategy\n5. Track and adjust based on performance'
        };
        return steps[topic] || '1. Assess your current situation\n2. Set clear, achievable goals\n3. Create an action plan\n4. Execute with consistency\n5. Review and adjust as needed';
    },
    
    getFollowUpQuestions(topic) {
        const questions = {
            study: [
                "What specific subject are you focusing on?",
                "How much time do you have before your exam?",
                "What learning methods have worked for you in the past?"
            ],
            training: [
                "What position do you play?",
                "What specific skills are you looking to improve?",
                "How many training sessions do you have per week?"
            ],
            nutrition: [
                "What are your current performance goals?",
                "Do you have any dietary restrictions?",
                "When are your most important competitions coming up?"
            ],
            mental: [
                "What mental challenges do you face during competition?",
                "Have you tried any mindfulness techniques before?",
                "How do you currently prepare mentally before games?"
            ]
        };
        
        return questions[topic] || [
            "Could you tell me more about your specific goals?",
            "What challenges are you currently facing?",
            "How can I best support your development?"
        ];
    }
};
