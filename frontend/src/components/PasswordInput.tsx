import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PasswordInputProps extends React.ComponentProps<"input"> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative flex items-center w-full">
        <Input
          type={showPassword ? "text" : "password"}
          className={`pr-10 ${className}`}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/50 rounded-md focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 transition-all" />
          ) : (
            <Eye className="h-4 w-4 transition-all" />
          )}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
